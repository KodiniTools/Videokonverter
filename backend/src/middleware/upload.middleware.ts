import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sanitize from 'sanitize-filename';
import { config } from '../config.js';

const storage = multer.diskStorage({
  destination: config.upload.uploadDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('video/')) {
    return cb(null, true);
  }
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.upload.allowedExtensions.includes(ext as (typeof config.upload.allowedExtensions)[number])) {
    return cb(null, true);
  }
  return cb(new Error('Only video files allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
});

export function sanitizeFilename(name: string): string {
  return sanitize(name) || 'video';
}
