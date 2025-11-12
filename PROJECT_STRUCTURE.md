# Projektstruktur

```
video-converter/
├── README.md                          # Vollständige Dokumentation
├── INSTALL.md                         # Quick Start Guide
├── CHANGELOG.md                       # Version History
├── nginx.conf.example                 # Nginx Config für Production
│
├── backend/                           # Node.js Backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── convert.ts            # API Endpoints
│   │   ├── services/
│   │   │   ├── ffmpeg.service.ts     # FFmpeg Integration
│   │   │   ├── cleanup.service.ts    # File Cleanup
│   │   │   └── disk-space.service.ts # Disk Monitoring
│   │   ├── middleware/
│   │   │   └── upload.middleware.ts  # Multer File Upload
│   │   ├── types/
│   │   │   └── conversion.ts         # TypeScript Types
│   │   ├── websocket.ts              # WebSocket Handler
│   │   └── server.ts                 # Express Server Entry
│   │
│   ├── uploads/                       # Temp Upload Files
│   ├── outputs/                       # Converted Files
│   ├── package.json
│   ├── tsconfig.json
│   └── ecosystem.config.js           # PM2 Config
│
└── frontend/                          # Vue 3 Frontend
    ├── src/
    │   ├── components/
    │   │   ├── FileUploader.vue      # Drag & Drop Upload
    │   │   ├── FormatSelector.vue    # Format/Quality Selector
    │   │   ├── ConversionItem.vue    # Single Job Item
    │   │   └── ConversionQueue.vue   # Job List
    │   ├── stores/
    │   │   └── conversion.ts         # Pinia Store
    │   ├── composables/
    │   │   └── useWebSocket.ts       # WebSocket Composable
    │   ├── types/
    │   │   └── conversion.ts         # TypeScript Types
    │   ├── App.vue                   # Root Component
    │   ├── main.ts                   # Entry Point
    │   ├── env.d.ts                  # Env Types
    │   └── vite-env.d.ts             # Vite Types
    │
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── .env.example                   # Environment Template
```

## Dateiübersicht

### Backend

| Datei | Zweck | Lines |
|-------|-------|-------|
| `server.ts` | Express Server, Middleware, Services | ~60 |
| `routes/convert.ts` | Upload & Download Endpoints | ~80 |
| `services/ffmpeg.service.ts` | FFmpeg Conversion Logic | ~70 |
| `services/cleanup.service.ts` | Auto File Cleanup | ~50 |
| `services/disk-space.service.ts` | Disk Space Check | ~20 |
| `middleware/upload.middleware.ts` | Multer Configuration | ~30 |
| `websocket.ts` | WebSocket Server & Broadcast | ~40 |
| `types/conversion.ts` | TypeScript Definitions | ~25 |

**Total Backend:** ~375 Lines Code

### Frontend

| Datei | Zweck | Lines |
|-------|-------|-------|
| `App.vue` | Root Layout + WS Connection | ~100 |
| `components/FileUploader.vue` | Upload UI + Drag & Drop | ~150 |
| `components/FormatSelector.vue` | Format/Quality Buttons | ~120 |
| `components/ConversionItem.vue` | Job Item + Progress | ~160 |
| `components/ConversionQueue.vue` | Job List Container | ~30 |
| `stores/conversion.ts` | State Management | ~140 |
| `composables/useWebSocket.ts` | WS Connection Logic | ~70 |
| `types/conversion.ts` | TypeScript Definitions | ~30 |
| `main.ts` | App Initialization | ~10 |

**Total Frontend:** ~810 Lines Code

## Datenfluss

```
1. USER UPLOAD
   FileUploader.vue → conversion.store.ts → Backend API

2. BACKEND PROCESSING
   Express → Multer → FFmpeg → WebSocket Broadcast

3. PROGRESS UPDATES
   WebSocket → useWebSocket.ts → conversion.store.ts → UI Update

4. DOWNLOAD
   ConversionItem.vue → conversion.store.ts → Backend Download
```

## API Flow

```
POST /api/convert
├── Multer (File Upload)
├── Disk Space Check
├── Job Registration
└── FFmpeg Start (async)
    └── Progress → WebSocket Broadcast

GET /api/download/:jobId
└── File Download via res.download()
```

## State Management

```typescript
// Pinia Store Structure
{
  jobs: ConversionJob[],        // Active + Completed
  settings: ConversionSettings, // Format + Quality
  
  // Computed
  activeJobs: ConversionJob[],
  completedJobs: ConversionJob[],
  
  // Actions
  uploadAndConvert(),
  handleProgressUpdate(),
  downloadFile(),
  removeJob()
}
```

## WebSocket Protocol

```typescript
// Client → Server
{ type: 'connect' }

// Server → Client
{
  jobId: string,
  progress: number,      // 0-100
  status: 'processing' | 'completed' | 'error',
  error?: string,
  downloadUrl?: string
}
```

## Environment Variables

**Backend:**
- `PORT` - Server Port (default: 3000)
- `NODE_ENV` - Environment (production/development)

**Frontend:**
- `VITE_API_URL` - Backend URL (default: http://localhost:3000)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:3000)

## Build Output

**Backend:** `dist/` - Compiled JavaScript
**Frontend:** `dist/` - Static HTML/CSS/JS

## Configuration Files

- `tsconfig.json` - TypeScript Compiler Options
- `vite.config.ts` - Vite Build Configuration
- `ecosystem.config.js` - PM2 Process Manager
- `nginx.conf.example` - Nginx Reverse Proxy
- `.gitignore` - Git Ignore Rules
- `.env.example` - Environment Template
