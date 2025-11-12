# Video Converter

Moderne Vue 3 Anwendung für server-basierte Videokonvertierung mit FFmpeg.

## Features

- ✅ Drag & Drop File Upload
- ✅ Echtzeit-Progress über WebSocket
- ✅ Mehrere Formate: MP4, WebM, AVI, MOV, MKV
- ✅ 4 Quality-Level: Low, Medium, High, Ultra
- ✅ Große Dateien bis 50GB
- ✅ Parallele Conversions
- ✅ Auto-Cleanup nach 2h
- ✅ Disk Space Monitoring

## Tech Stack

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Pinia (State Management)
- Vite

**Backend:**
- Node.js / Express
- TypeScript
- FFmpeg
- WebSocket (ws)

## Voraussetzungen

- Node.js 20+
- FFmpeg installiert
- 500GB+ freier Disk Space (empfohlen)

### FFmpeg Installation

**Debian/Ubuntu:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download von https://ffmpeg.org/download.html

## Installation

### Backend

```bash
cd backend
npm install

# .env erstellen (optional)
cp .env.example .env

# Development
npm run dev

# Production Build
npm run build
npm start
```

Server läuft auf: http://localhost:3000

### Frontend

```bash
cd frontend
npm install

# .env erstellen
cp .env.example .env

# Development
npm run dev

# Production Build
npm run build
```

Frontend läuft auf: http://localhost:5173

## Konfiguration

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Backend

Anpassungen in `/backend/src`:

**Max File Size:**
- `middleware/upload.middleware.ts` → Zeile 4
- Aktuell: `50 * 1024 * 1024 * 1024` (50GB)

**Cleanup Settings:**
- `services/cleanup.service.ts`
- Intervall: 30 Minuten
- Max Age: 2 Stunden

## Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50G;
    client_body_timeout 3600s;
    proxy_read_timeout 3600s;
    proxy_connect_timeout 3600s;
    proxy_send_timeout 3600s;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_request_buffering off;
    }

    location / {
        root /var/www/video-converter/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## PM2 (Production)

```bash
cd backend
npm install -g pm2

pm2 start dist/server.js --name video-converter
pm2 save
pm2 startup
```

## Struktur

```
video-converter/
├── backend/
│   ├── src/
│   │   ├── routes/         # API Endpoints
│   │   ├── services/       # Business Logic
│   │   ├── middleware/     # Express Middleware
│   │   ├── types/          # TypeScript Types
│   │   ├── websocket.ts    # WebSocket Handler
│   │   └── server.ts       # Entry Point
│   ├── uploads/            # Temp Upload Files
│   ├── outputs/            # Converted Files
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/     # Vue Components
    │   ├── stores/         # Pinia Stores
    │   ├── composables/    # Vue Composables
    │   ├── types/          # TypeScript Types
    │   ├── App.vue
    │   └── main.ts
    └── package.json
```

## API Endpoints

### POST `/api/convert`
Upload und Konvertierung starten

**Body (FormData):**
- `video` - Video File
- `targetFormat` - mp4 | webm | avi | mov | mkv
- `quality` - low | medium | high | ultra
- `jobId` - UUID

**Response:**
```json
{
  "jobId": "uuid",
  "status": "processing"
}
```

### GET `/api/download/:jobId`
Konvertierte Datei herunterladen

## WebSocket Events

**Progress Update:**
```json
{
  "jobId": "uuid",
  "progress": 75,
  "status": "processing"
}
```

**Completion:**
```json
{
  "jobId": "uuid",
  "progress": 100,
  "status": "completed",
  "downloadUrl": "/api/download/uuid"
}
```

**Error:**
```json
{
  "jobId": "uuid",
  "status": "error",
  "error": "Error message"
}
```

## Troubleshooting

### FFmpeg nicht gefunden
```bash
# Überprüfen
ffmpeg -version

# Path setzen (Linux)
export PATH=$PATH:/usr/local/bin
```

### Port bereits belegt
```bash
# Backend Port ändern
PORT=3001 npm run dev

# Frontend Port ändern (vite.config.ts)
server: { port: 5174 }
```

### Disk Space Error
```bash
# Manuelles Cleanup
rm -rf backend/uploads/*
rm -rf backend/outputs/*
```

### WebSocket Connection Failed
- CORS Settings prüfen
- Firewall Rules prüfen
- WS_URL in Frontend .env korrekt

## Performance

**Hardware Requirements:**
- CPU: 4+ Cores (8+ empfohlen)
- RAM: 8GB+ (16GB empfohlen)
- Disk: 500GB+ SSD
- Network: 100 Mbps+ Upload

**Optimierungen:**
- Parallele FFmpeg Instanzen limitieren
- Redis Queue für Job Management
- S3/Cloud Storage statt lokalem Filesystem
- CDN für Downloads

## Sicherheit

- ✅ File Type Validation
- ✅ File Size Limits
- ✅ Auto-Cleanup
- ⚠️ Rate Limiting implementieren
- ⚠️ Authentication für Production
- ⚠️ HTTPS/WSS für Production

## Lizenz

MIT

## Support

Bei Fragen oder Problemen bitte Issue auf GitHub erstellen.
