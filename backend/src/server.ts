import express from 'express';
import cors from 'cors';
import http from 'http';
import helmet from 'helmet';
import { config } from './config.js';
import convertRoutes, { ffmpegService } from './routes/convert.js';
import { initWebSocket } from './websocket.js';
import { CleanupService } from './services/cleanup.service.js';
import { DiskSpaceService } from './services/disk-space.service.js';
import { apiRateLimit } from './middleware/rate-limit.middleware.js';

const app = express();

// Performance-Optimierung: HTTP Server mit optimierten Einstellungen
const server = http.createServer({
  // Keep-Alive für bessere Connection-Wiederverwendung
  keepAlive: true,
  keepAliveTimeout: config.server.keepAliveTimeout, // 65 Sekunden (länger als Nginx default 60s)
  // Timeout für Requests erhöhen (für große Uploads)
  requestTimeout: config.server.requestTimeout, // Deaktiviert
  // Header Timeout
  headersTimeout: config.server.headersTimeout, // Etwas länger als keepAliveTimeout
}, app);

// Performance-Optimierung: Trust Proxy für korrekte Client-IPs hinter Nginx
app.set('trust proxy', 1);

// Performance-Optimierung: ETag deaktivieren für große Video-Dateien (spart CPU)
app.set('etag', false);

// Security: Secure HTTP headers
app.use(helmet());

// Middleware
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
}));

// General rate limiting
app.use(apiRateLimit);

// Performance-Optimierung: Body Parser nur für JSON/URL-encoded, nicht für Uploads
// Uploads werden durch Multer als Streams verarbeitet
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ limit: config.server.bodyLimit, extended: true }));

// Routes
app.use('/api', convertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket
initWebSocket(server);

// Cleanup Service
const cleanupService = new CleanupService();
cleanupService.start();

// Disk Space Monitoring
const diskSpaceService = new DiskSpaceService();
setInterval(async () => {
  const hasSpace = await diskSpaceService.checkAvailableSpace(10); // Warn below 20GB free (2x buffer)
  if (!hasSpace) {
    console.error('[Server] WARNING: Low disk space! Less than 20GB free.');
  }
}, config.cleanup.intervalMs);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`[Server] ${signal} received, shutting down gracefully...`);

  // 1. Cleanup Service stoppen
  cleanupService.stop();

  // 2. Alle aktiven ffmpeg-Prozesse killen
  const processManager = ffmpegService.getProcessManager();
  const activeProcesses = processManager.getActiveProcesses();

  if (activeProcesses.length > 0) {
    console.log(`[Server] Stopping ${activeProcesses.length} active conversion(s)...`);
    await processManager.killAll();
  }

  // 3. HTTP Server schließen (keine neuen Verbindungen mehr)
  server.close(() => {
    console.log('[Server] HTTP server closed');
    console.log('[Server] ✅ Graceful shutdown complete');
    process.exit(0);
  });

  // 4. Timeout: Force-Exit nach 30 Sekunden
  setTimeout(() => {
    console.error('[Server] ⚠️ Graceful shutdown timeout, forcing exit...');
    process.exit(1);
  }, config.server.gracefulShutdownMs);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C

server.listen(config.server.port, async () => {
  console.log(`[Server] Running on http://localhost:${config.server.port}`);
  console.log(`[WS] WebSocket available on ws://localhost:${config.server.port}`);

  // Zombie-Prozesse und alte Dateien beim Start aufräumen
  const processManager = ffmpegService.getProcessManager();
  await processManager.detectAndKillZombies();
});
