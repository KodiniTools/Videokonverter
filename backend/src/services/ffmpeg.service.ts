import ffmpeg from 'fluent-ffmpeg';
import { QUALITY_PRESETS, type ConversionOptions } from '../types/conversion.js';
import { broadcastProgress } from '../websocket.js';

export class FFmpegService {
  async convert(options: ConversionOptions): Promise<void> {
    const { jobId, inputPath, outputPath, targetFormat, quality } = options;
    const settings = QUALITY_PRESETS[quality];

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .output(outputPath)
        .videoBitrate(settings.bitrate)
        .videoCodec(this.getCodec(targetFormat))
        .preset(settings.preset)
        .audioCodec('aac')
        .audioBitrate('128k');

      command.on('start', (cmdLine) => {
        console.log(`[FFmpeg] Started: ${cmdLine}`);
        broadcastProgress({
          jobId,
          progress: 0,
          status: 'processing'
        });
      });

      command.on('progress', (progress) => {
        const percent = Math.min(Math.round(progress.percent || 0), 99);
        broadcastProgress({
          jobId,
          progress: percent,
          status: 'processing'
        });
      });

      command.on('end', () => {
        console.log(`[FFmpeg] Completed: ${jobId}`);
        broadcastProgress({
          jobId,
          progress: 100,
          status: 'completed',
          downloadUrl: `/api/download/${jobId}`
        });
        resolve();
      });

      command.on('error', (err) => {
        console.error(`[FFmpeg] Error: ${err.message}`);
        broadcastProgress({
          jobId,
          progress: 0,
          status: 'error',
          error: err.message
        });
        reject(err);
      });

      command.run();
    });
  }

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
