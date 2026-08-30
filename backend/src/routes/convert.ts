import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { upload, sanitizeFilename } from '../middleware/upload.middleware.js';
import { uploadRateLimit, convertRateLimit, downloadRateLimit } from '../middleware/rate-limit.middleware.js';
import { FFmpegService } from '../services/ffmpeg.service.js';
import { DiskSpaceService } from '../services/disk-space.service.js';
import { config } from '../config.js';
import type { VideoFormat, VideoQuality } from '../types/conversion.js';

const router = Router();
const ffmpegService = new FFmpegService();
const diskSpaceService = new DiskSpaceService();

// Export für Graceful Shutdown
export { ffmpegService };

// Uploaded files Map (vor Konvertierung)
const uploadedFiles = new Map<string, { inputPath: string; originalName: string; fileSize: number }>();

// Conversion Jobs Map (nach Start der Konvertierung)
const jobs = new Map<string, { outputPath: string; format: string; originalName: string }>();

/**
 * Helper function to add uploaded files with size limit
 */
function addUploadedFile(jobId: string, fileData: { inputPath: string; originalName: string; fileSize: number }) {
  if (uploadedFiles.size >= config.jobs.maxUploadedFiles) {
    const firstKey = uploadedFiles.keys().next().value;
    if (firstKey) {
      uploadedFiles.delete(firstKey);
      console.log(`[Upload] ⚠️  Map limit reached, removed oldest: ${firstKey}`);
    }
  }
  uploadedFiles.set(jobId, fileData);
}

/**
 * Helper function to add jobs with size limit
 */
function addJob(jobId: string, jobData: { outputPath: string; format: string; originalName: string }) {
  if (jobs.size >= config.jobs.maxJobs) {
    const firstKey = jobs.keys().next().value;
    if (firstKey) {
      jobs.delete(firstKey);
      console.log(`[Jobs] ⚠️  Map limit reached (${config.jobs.maxJobs}), removed oldest: ${firstKey}`);
    }
  }
  jobs.set(jobId, jobData);
}

// GET /api/jobs — return all known jobs for frontend restoration after reload
router.get('/jobs', (req, res) => {
  const result: Array<{
    jobId: string;
    status: 'uploaded' | 'processing';
    originalName: string;
    fileSize?: number;
    format?: string;
  }> = [];

  for (const [jobId, file] of uploadedFiles.entries()) {
    result.push({
      jobId,
      status: 'uploaded',
      originalName: file.originalName,
      fileSize: file.fileSize,
    });
  }

  for (const [jobId, job] of jobs.entries()) {
    result.push({
      jobId,
      status: 'processing',
      originalName: job.originalName,
      format: job.format,
    });
  }

  res.json({ jobs: result });
});

// Upload-Endpunkt: Nur Datei hochladen, noch nicht konvertieren
router.post('/upload', uploadRateLimit, upload.single('video'), async (req, res) => {
  try {
    // Performance-Optimierung: Timeouts sofort deaktivieren für große Uploads
    req.setTimeout(0);
    res.setTimeout(0);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobId, originalName } = req.body as {
      jobId: string;
      originalName?: string;
    };

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    // Originalname aus Request oder Fallback auf Multer-Originalname
    const fileName = originalName || req.file.originalname || 'video';

    // Check disk space
    const fileSizeGB = req.file.size / 1024 / 1024 / 1024;
    const hasSpace = await diskSpaceService.checkAvailableSpace(fileSizeGB);

    if (!hasSpace) {
      // Datei löschen wenn kein Platz
      try {
        await fs.unlink(req.file.path);
      } catch (e) { /* ignore */ }
      return res.status(507).json({
        error: 'Insufficient disk space',
        message: 'Server has not enough free disk space'
      });
    }

    // Datei-Info speichern (noch keine Konvertierung)
    addUploadedFile(jobId, {
      inputPath: req.file.path,
      originalName: fileName,
      fileSize: req.file.size
    });

    console.log(`[Upload] ✅ File uploaded: ${fileName} (${jobId})`);

    res.json({
      jobId,
      status: 'uploaded',
      filePath: req.file.path,
      fileName,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Konvertierung starten für bereits hochgeladene Datei
router.post('/convert/:jobId', convertRateLimit, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { targetFormat, quality } = req.body as {
      targetFormat: VideoFormat;
      quality: VideoQuality;
    };

    if (!targetFormat || !quality) {
      return res.status(400).json({ error: 'Missing targetFormat or quality' });
    }

    // Hochgeladene Datei finden
    const uploadedFile = uploadedFiles.get(jobId);
    if (!uploadedFile) {
      return res.status(404).json({ error: 'Uploaded file not found' });
    }

    const outputFilename = `output-${jobId}.${targetFormat}`;
    const outputPath = path.join(config.upload.outputDir, outputFilename);

    // Job-Info speichern
    addJob(jobId, { outputPath, format: targetFormat, originalName: uploadedFile.originalName });

    // Aus Upload-Map entfernen
    uploadedFiles.delete(jobId);

    // Konvertierung starten (async)
    ffmpegService.convert({
      jobId,
      inputPath: uploadedFile.inputPath,
      outputPath,
      targetFormat,
      quality
    }).catch((error) => {
      console.error(`[Convert] Failed for ${jobId}:`, error);
    });

    console.log(`[Convert] ✅ Started conversion: ${jobId} → ${targetFormat}`);

    res.json({ jobId, status: 'processing' });
  } catch (error) {
    console.error('[Convert] Error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

router.get('/download/:jobId', downloadRateLimit, (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Sanitize filename to prevent Content-Disposition injection
  const baseName = sanitizeFilename(job.originalName).replace(/\.[^.]+$/, '');
  const safeFilename = `${baseName}.${job.format}`;

  res.download(job.outputPath, safeFilename, async (err) => {
    if (err) {
      console.error('[Download] Error:', err);
      // Bei Fehler nicht zurücksenden wenn bereits gesendet
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    } else {
      // FIX Problem 2: Output-Datei sofort nach erfolgreichem Download löschen
      try {
        await fs.unlink(job.outputPath);
        console.log(`[Download] ✅ Deleted output file: ${job.outputPath}`);
      } catch (unlinkErr) {
        console.error('[Download] ⚠️  Failed to delete output:', unlinkErr);
      }

      // FIX Problem 1: Job aus Map entfernen nach erfolgreichem Download
      jobs.delete(jobId);
      console.log(`[Download] ✅ Removed job from memory: ${jobId}`);
    }
  });
});

// DELETE /api/jobs/:jobId — remove a queued job (frontend "Entfernen" button)
// Handles both uploaded-but-not-converted files and running/finished conversions,
// so a removed file does not reappear after a page reload via GET /api/jobs.
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    let removed = false;

    // Uploaded file that has not been converted yet
    const uploadedFile = uploadedFiles.get(jobId);
    if (uploadedFile) {
      try {
        await fs.unlink(uploadedFile.inputPath);
      } catch (e) { /* file already gone – ignore */ }
      uploadedFiles.delete(jobId);
      removed = true;
    }

    // Job that is converting or already converted
    const job = jobs.get(jobId);
    if (job) {
      // Stop the ffmpeg process if it is still running
      try {
        await ffmpegService.getProcessManager().kill(jobId, 'user_cancel');
      } catch (e) { /* not running – ignore */ }
      try {
        await fs.unlink(job.outputPath);
      } catch (e) { /* output not written yet – ignore */ }
      jobs.delete(jobId);
      removed = true;
    }

    console.log(`[Jobs] 🗑️  Removed job: ${jobId}${removed ? '' : ' (was not tracked)'}`);

    // Idempotent: if the server no longer tracks it, the client is already in sync
    res.json({ success: true, removed });
  } catch (error) {
    console.error('[Jobs] Delete error:', error);
    res.status(500).json({ error: 'Failed to remove job' });
  }
});

// Cancel/Abort API
router.delete('/convert/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    console.log(`[Convert] Cancel request for job: ${jobId}`);

    // Prozess über Process Manager killen
    const processManager = ffmpegService.getProcessManager();
    const success = await processManager.kill(jobId, 'user_cancel');

    if (success) {
      // Job aus Map entfernen
      jobs.delete(jobId);

      res.json({
        success: true,
        message: 'Conversion cancelled successfully'
      });
    } else {
      res.status(404).json({
        error: 'Job not found or already completed'
      });
    }
  } catch (error) {
    console.error('[Convert] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel conversion' });
  }
});

export default router;
