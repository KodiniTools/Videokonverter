import { spawn } from 'child_process';
import { QUALITY_PRESETS, type ConversionOptions } from '../types/conversion.js';
import { broadcastProgress } from '../websocket.js';

export class FFmpegService {
  private gpuAvailable: boolean | null = null;

  /**
   * Detect if GPU encoding (h264_nvenc) is available
   */
  private async detectGPU(): Promise<boolean> {
    if (this.gpuAvailable !== null) {
      return this.gpuAvailable;
    }

    console.log('[FFmpeg] Detecting available encoders...');

    return new Promise((resolve) => {
      const process = spawn('ffmpeg', ['-encoders']);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', () => {
        this.gpuAvailable = output.includes('h264_nvenc');
        if (this.gpuAvailable) {
          console.log('[FFmpeg] ✅ GPU encoder detected: h264_nvenc');
        } else {
          console.log('[FFmpeg] ℹ️  No GPU encoder found, using CPU only');
        }
        resolve(this.gpuAvailable);
      });

      process.on('error', () => {
        this.gpuAvailable = false;
        resolve(false);
      });
    });
  }

  /**
   * Main conversion method with GPU fallback
   */
  async convert(options: ConversionOptions): Promise<void> {
    const { jobId, inputPath, outputPath, targetFormat, quality } = options;
    const settings = QUALITY_PRESETS[quality];

    // Try GPU first if available
    const hasGPU = await this.detectGPU();

    if (hasGPU && targetFormat === 'mp4') {
      try {
        await this.convertWithGPU(options, settings);
        return;
      } catch (error) {
        console.log('[FFmpeg] 🔄 GPU failed, retrying with CPU encoding...');
      }
    }

    // Fallback to CPU
    await this.convertWithCPU(options, settings);
  }

  /**
   * GPU encoding with h264_nvenc - OPTIMIZED
   */
  private async convertWithGPU(
    options: ConversionOptions,
    settings: { bitrate: string; preset: string }
  ): Promise<void> {
    const { jobId, inputPath, outputPath, quality } = options;

    console.log(`[FFmpeg] 🚀 GPU: h264_nvenc (quality: ${quality})`);

    const args = [
      '-i', inputPath,
      '-y',
      // Audio settings
      '-acodec', 'aac',
      '-b:a', '128k',
      // GPU encoding
      '-vcodec', 'h264_nvenc',
      '-preset', 'p4',  // p1=fastest, p7=slowest, p4=balanced
      '-tune', 'hq',     // High quality tune
      '-rc', 'vbr',      // Variable bitrate
      '-cq', quality === 'high' ? '19' : quality === 'medium' ? '23' : '28',
      '-b:v', settings.bitrate,
      '-maxrate', settings.bitrate,
      '-bufsize', `${parseInt(settings.bitrate) * 2}k`,
      // Encoding optimizations
      '-profile:v', 'main',
      '-level', '4.1',
      '-movflags', '+faststart',  // Optimize for streaming
      outputPath
    ];

    console.log(`[FFmpeg] Command: ffmpeg ${args.join(' ')}`);

    return this.runFFmpeg(jobId, args, inputPath);
  }

  /**
   * CPU encoding with libx264 - OPTIMIZED
   */
  private async convertWithCPU(
    options: ConversionOptions,
    settings: { bitrate: string; preset: string }
  ): Promise<void> {
    const { jobId, inputPath, outputPath, targetFormat, quality } = options;

    console.log(`[FFmpeg] 💻 CPU: ${this.getCodec(targetFormat)} (quality: ${quality})`);

    const args = [
      '-i', inputPath,
      '-y',
      // Performance: Use all available CPU cores
      '-threads', '0',  // 0 = auto-detect optimal thread count
      // Audio settings
      '-acodec', 'aac',
      '-b:a', '128k',
      // Video codec
      '-vcodec', this.getCodec(targetFormat),
      '-b:v', settings.bitrate,
      // IMPORTANT: "ultrafast" = schnell aber große Datei, "medium" = langsam aber kleine Datei
      '-preset', 'veryfast',  // Realistic speed/quality balance
      '-tune', 'fastdecode',  // Optimize for fast decoding
      // Quality settings
      '-crf', quality === 'high' ? '18' : quality === 'medium' ? '23' : '28',
      '-profile:v', 'main',
      '-level', '4.1',
      // Streaming optimization
      '-movflags', '+faststart',
      outputPath
    ];

    console.log(`[FFmpeg] Command: ffmpeg ${args.join(' ')}`);

    return this.runFFmpeg(jobId, args, inputPath);
  }

  /**
   * Execute FFmpeg with progress tracking
   */
  private async runFFmpeg(
    jobId: string,
    args: string[],
    inputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', args);

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

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[FFmpeg] ✅ Completed: ${jobId}`);
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

          broadcastProgress({
            jobId,
            progress: 0,
            status: 'error',
            error: `Conversion failed with code ${code}`
          });

          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        console.error(`[FFmpeg] ❌ Process error: ${err.message}`);
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
