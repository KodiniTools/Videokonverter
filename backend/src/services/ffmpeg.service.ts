import { spawn } from 'child_process';
import { QUALITY_PRESETS, type ConversionOptions } from '../types/conversion.js';
import { broadcastProgress } from '../websocket.js';
import { ProcessManagerService } from './process-manager.service.js';

export class FFmpegService {
  private processManager = new ProcessManagerService();

  /**
   * Gibt Zugriff auf den Process Manager (für Graceful Shutdown)
   */
  getProcessManager(): ProcessManagerService {
    return this.processManager;
  }
  /**
   * Main conversion method - CPU only (GPU disabled due to server limitations)
   */
  async convert(options: ConversionOptions): Promise<void> {
    const { jobId, inputPath, outputPath, targetFormat, quality } = options;
    const settings = QUALITY_PRESETS[quality];

    console.log('[FFmpeg] 💻 CPU encoding (quality: ${quality})');

    // CPU conversion with optimizations
    await this.convertWithCPU(options, settings);
  }


  /**
   * CPU encoding - OPTIMIZED for problematic WMV files with format-specific parameters
   */
  private async convertWithCPU(
    options: ConversionOptions,
    settings: { bitrate: string; preset: string }
  ): Promise<void> {
    const { jobId, inputPath, outputPath, targetFormat, quality } = options;
    const codec = this.getCodec(targetFormat);

    console.log(`[FFmpeg] 💻 CPU: ${codec} (quality: ${quality})`);

    // Base arguments (common for all formats)
    const args = [
      // Input handling for WMV with timestamp issues
      '-fflags', '+genpts',  // Generate presentation timestamps
      '-i', inputPath,
      '-y',
      // Performance: Use all available CPU cores
      '-threads', '0',  // 0 = auto-detect optimal thread count
      // FIX: Force constant framerate to prevent frame duplication
      '-r', '30',  // Output 30fps
      '-vsync', 'cfr',  // Constant framerate
    ];

    // Audio settings (format-specific)
    if (targetFormat === 'avi') {
      args.push('-acodec', 'libmp3lame', '-b:a', '128k');
    } else if (targetFormat === 'webm') {
      args.push('-acodec', 'libopus', '-b:a', '128k');  // WebM requires Opus or Vorbis
    } else {
      args.push('-acodec', 'aac', '-b:a', '128k');  // MP4, MOV, MKV use AAC
    }

    // Video codec
    args.push('-vcodec', codec, '-b:v', settings.bitrate);

    // Format-specific video encoding parameters
    if (codec === 'libx264') {
      // MP4, MOV, MKV - libx264 parameters
      args.push(
        '-preset', 'ultrafast',  // Maximum speed
        '-tune', 'zerolatency',  // Speed optimization
        '-crf', quality === 'high' ? '20' : quality === 'medium' ? '25' : '30',
        '-profile:v', 'baseline',  // Faster than main profile
        '-level', '3.0',
        '-bf', '0'  // No B-frames = faster
      );
    } else if (codec === 'libvpx-vp9') {
      // WebM - VP9 parameters
      args.push(
        '-deadline', 'realtime',  // Speed mode for VP9
        '-cpu-used', '8',  // 0=slowest, 8=fastest
        '-crf', quality === 'high' ? '20' : quality === 'medium' ? '25' : '30',
        '-row-mt', '1'  // Multi-threading for VP9
      );
    } else if (codec === 'mpeg4') {
      // AVI - MPEG4 parameters (no preset support)
      args.push(
        '-q:v', quality === 'high' ? '3' : quality === 'medium' ? '5' : '8'  // Quality scale 1-31
      );
    }

    // Container-specific optimizations
    if (targetFormat === 'mp4' || targetFormat === 'mov') {
      args.push('-movflags', '+faststart');  // Streaming optimization
    }

    args.push(outputPath);

    console.log(`[FFmpeg] Command: ffmpeg ${args.join(' ')}`);

    return this.runFFmpeg(jobId, args, inputPath);
  }

  /**
   * Execute FFmpeg with progress tracking
   */
  private async runFFmpeg(
    jobId: string,
    args: string[],
    inputPath: string,
    outputPath?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', args);

      // Finde outputPath aus args (letztes Argument)
      const finalOutputPath = outputPath || args[args.length - 1];

      // Prozess im Process Manager registrieren
      this.processManager.register(jobId, ffmpegProcess, inputPath, finalOutputPath);

      let stderr = '';
      let duration = 0;
      let lastProgress = 0;

      broadcastProgress({
        jobId,
        progress: 0,
        status: 'processing'
      });

      // Parse stderr for progress
      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;

        // Extract duration
        const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (durationMatch) {
          const [, hours, minutes, seconds] = durationMatch;
          duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        }

        // Extract progress
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch && duration > 0) {
          const [, hours, minutes, seconds] = timeMatch;
          const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
          const progress = Math.min(Math.round((currentTime / duration) * 100), 99);

          // Only broadcast if progress changed significantly
          if (progress > lastProgress) {
            lastProgress = progress;
            broadcastProgress({
              jobId,
              progress,
              status: 'processing'
            });
          }
        }
      });

      ffmpegProcess.on('close', async (code) => {
        if (code === 0) {
          console.log(`[FFmpeg] ✅ Completed: ${jobId}`);

          // Auto-Cleanup: Input-Datei nach erfolgreicher Konvertierung löschen
          await this.processManager.cleanupInput(jobId);

          // Prozess aus Registry entfernen
          this.processManager.unregister(jobId);

          broadcastProgress({
            jobId,
            progress: 100,
            status: 'completed',
            downloadUrl: `/api/download/${jobId}`
          });
          resolve();
        } else {
          const lastLines = stderr.split('\n').slice(-10).join('\n');
          console.error(`[FFmpeg] ❌ Error: ffmpeg exited with code ${code}`);
          console.error(`[FFmpeg] Last stderr:\n${lastLines}`);

          // Cleanup bei Fehler: Beide Dateien löschen
          const job = this.processManager['activeProcesses'].get(jobId);
          if (job) {
            await this.processManager.cleanupFiles(job);
          }

          // Prozess aus Registry entfernen
          this.processManager.unregister(jobId);

          broadcastProgress({
            jobId,
            progress: 0,
            status: 'error',
            error: `Conversion failed with code ${code}`
          });

          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', async (err) => {
        console.error(`[FFmpeg] ❌ Process error: ${err.message}`);

        // Cleanup bei Fehler: Beide Dateien löschen
        const job = this.processManager['activeProcesses'].get(jobId);
        if (job) {
          await this.processManager.cleanupFiles(job);
        }

        // Prozess aus Registry entfernen
        this.processManager.unregister(jobId);

        broadcastProgress({
          jobId,
          progress: 0,
          status: 'error',
          error: err.message
        });
        reject(err);
      });
    });
  }

  /**
   * Get codec for target format
   */
  private getCodec(format: string): string {
    const codecs: Record<string, string> = {
      mp4: 'libx264',
      webm: 'libvpx-vp9',
      avi: 'mpeg4',
      mov: 'libx264',
      mkv: 'libx264'
    };
    return codecs[format] || 'libx264';
  }
}
