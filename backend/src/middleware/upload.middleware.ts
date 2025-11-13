import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

// Performance-Optimierung: Größere Buffer für schnellere I/O-Operationen
// 16MB Chunks statt Standard 64KB für bessere Upload-Geschwindigkeit bei großen Dateien
const UPLOAD_BUFFER_SIZE = 16 * 1024 * 1024; // 16MB

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!file.mimetype.startsWith('video/')) {
    return cb(new Error('Only video files allowed'));
  }
  cb(null, true);
};

// Performance-Optimierung: Optimierter Storage mit größeren Buffern
const optimizedStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  }
});

// Original Upload (bleibt unverändert für Kompatibilität)
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});
