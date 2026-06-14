export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    bodyLimit: '50gb',
    keepAliveTimeout: 65_000,
    headersTimeout: 66_000,
    requestTimeout: 0,
    gracefulShutdownMs: 30_000,
  },
  upload: {
    maxFileSizeBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxFileSizeGB: 5,
    allowedExtensions: ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.ts'] as const,
    uploadDir: 'uploads',
    outputDir: 'outputs',
  },
  jobs: {
    maxJobs: 1_000,
    maxUploadedFiles: 1_000,
    timeoutMs: 60 * 60 * 1000, // 1 hour
    gracefulKillMs: 5_000,
  },
  cleanup: {
    intervalMs: 5 * 60 * 1000,   // 5 minutes
    maxAgeMs: 15 * 60 * 1000,    // 15 minutes
  },
  rateLimit: {
    upload: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: 'Too many uploads from this IP, please try again later.',
    },
    convert: {
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: 'Too many conversion requests from this IP, please try again later.',
    },
    download: {
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: 'Too many download requests from this IP, please try again later.',
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'],
  },
  ffmpeg: {
    stderrRingBuffer: 100,
    threads: 0, // 0 = auto
  },
} as const;
