import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { upload } from '../middleware/upload.middleware.js';
import { FFmpegService } from '../services/ffmpeg.service.js';
import { DiskSpaceService } from '../services/disk-space.service.js';
import type { VideoFormat, VideoQuality } from '../types/conversion.js';

const router = Router();
const ffmpegService = new FFmpegService();
const diskSpaceService = new DiskSpaceService();

// Export für Graceful Shutdown
export { ffmpegService };

// Conversion Jobs Map with size limit to prevent unbounded memory growth
const jobs = new Map<string, { outputPath: string; format: string; originalName: string }>();
const MAX_JOBS_IN_MEMORY = 1000;

/**
 * FIX Problem 6: Helper function to add jobs with size limit
 */
function addJob(jobId: string, jobData: { outputPath: string; format: string; originalName: string }) {
  // Wenn Limit erreicht, ältesten Job entfernen (FIFO)
  if (jobs.size >= MAX_JOBS_IN_MEMORY) {
    const firstKey = jobs.keys().next().value;
    if (firstKey) {
      jobs.delete(firstKey);
      console.log(`[Jobs] ⚠️  Map limit reached (${MAX_JOBS_IN_MEMORY}), removed oldest: ${firstKey}`);
    }
  }
  jobs.set(jobId, jobData);
}

router.post('/convert', upload.single('video'), async (req, res) => {
  try {
    // Performance-Optimierung: Timeouts sofort deaktivieren für große Uploads
    req.setTimeout(0);
    res.setTimeout(0);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobId, targetFormat, quality, originalName } = req.body as {
      jobId: string;
      targetFormat: VideoFormat;
      quality: VideoQuality;
      originalName?: string;
    };

    if (!jobId || !targetFormat || !quality) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    // Originalname aus Request oder Fallback auf Multer-Originalname
    const fileName = originalName || req.file.originalname || 'video';

    // Check disk space
    const fileSizeGB = req.file.size / 1024 / 1024 / 1024;
    const hasSpace = await diskSpaceService.checkAvailableSpace(fileSizeGB);

    if (!hasSpace) {
      return res.status(507).json({
        error: 'Insufficient disk space',
        message: 'Server has not enough free disk space for this conversion'
      });
    }

    const outputFilename = `output-${jobId}.${targetFormat}`;
    const outputPath = path.join('outputs', outputFilename);

    // Store job info (mit Size-Limit Check)
    addJob(jobId, { outputPath, format: targetFormat, originalName: fileName });

    // Start conversion (async)
    ffmpegService.convert({
      jobId,
      inputPath: req.file.path,
      outputPath,
      targetFormat,
      quality
    }).catch((error) => {
      console.error(`[Convert] Failed for ${jobId}:`, error);
    });

    res.json({ jobId, status: 'processing' });
  } catch (error) {
    console.error('[Convert] Error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

router.get('/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Originalnamen verwenden: Dateiname ohne alte Endung + neue Endung
  const baseName = job.originalName.replace(/\.[^.]+$/, '');
  const filename = `${baseName}.${job.format}`;
  res.download(job.outputPath, filename, async (err) => {
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
