import express from 'express';
import cors from 'cors';
import http from 'http';
import convertRoutes from './routes/convert.js';
import { initWebSocket } from './websocket.js';
import { CleanupService } from './services/cleanup.service.js';
import { DiskSpaceService } from './services/disk-space.service.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50gb' }));
app.use(express.urlencoded({ limit: '50gb', extended: true }));

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
  const hasSpace = await diskSpaceService.checkAvailableSpace(100); // 100GB threshold
  if (!hasSpace) {
    console.error('[Server] WARNING: Low disk space! Less than 100GB free.');
  }
}, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down...');
  cleanupService.stop();
  server.close(() => {
    console.log('[Server] Process terminated');
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[WS] WebSocket available on ws://localhost:${PORT}`);
});
