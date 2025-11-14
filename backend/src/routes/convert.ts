import { Router } from 'express';
import path from 'path';
import { upload } from '../middleware/upload.middleware.js';
import { FFmpegService } from '../services/ffmpeg.service.js';
import { DiskSpaceService } from '../services/disk-space.service.js';
import type { VideoFormat, VideoQuality } from '../types/conversion.js';

const router = Router();
const ffmpegService = new FFmpegService();
const diskSpaceService = new DiskSpaceService();

// Export für Graceful Shutdown
export { ffmpegService };

// Conversion Jobs Map
const jobs = new Map<string, { outputPath: string; format: string }>();

router.post('/convert', upload.single('video'), async (req, res) => {
  try {
    // Performance-Optimierung: Timeouts sofort deaktivieren für große Uploads
    req.setTimeout(0);
    res.setTimeout(0);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { jobId, targetFormat, quality } = req.body as {
      jobId: string;
      targetFormat: VideoFormat;
      quality: VideoQuality;
    };

    if (!jobId || !targetFormat || !quality) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

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

    // Store job info
    jobs.set(jobId, { outputPath, format: targetFormat });

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

  const filename = `converted.${job.format}`;
  res.download(job.outputPath, filename, (err) => {
    if (err) {
      console.error('[Download] Error:', err);
      res.status(500).json({ error: 'Download failed' });
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
