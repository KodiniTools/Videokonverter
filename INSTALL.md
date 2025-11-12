# Quick Installation Guide

## 1. FFmpeg installieren

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verifizieren:**
```bash
ffmpeg -version
```

## 2. Backend Setup

```bash
cd backend
npm install

# .env erstellen (optional)
echo "PORT=3000" > .env

# Development starten
npm run dev
```

✅ Backend läuft auf: **http://localhost:3000**

## 3. Frontend Setup

```bash
cd frontend
npm install

# .env erstellen
cp .env.example .env

# Development starten
npm run dev
```

✅ Frontend läuft auf: **http://localhost:5173**

## 4. Testen

1. Browser öffnen: http://localhost:5173
2. Video hochladen (Drag & Drop)
3. Format & Quality wählen
4. Conversion starten

## 5. Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# dist/ Ordner auf Server deployen
```

## Troubleshooting

### Port 3000 belegt
```bash
# Backend Port ändern
PORT=3001 npm run dev
```

### FFmpeg nicht gefunden
```bash
which ffmpeg
# Falls leer, FFmpeg installieren
```

### WebSocket Connection Error
- Backend muss laufen
- VITE_WS_URL in frontend/.env prüfen

---

📚 Vollständige Dokumentation: **README.md**
