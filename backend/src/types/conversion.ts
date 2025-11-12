export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv';
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface ConversionOptions {
  jobId: string;
  inputPath: string;
  outputPath: string;
  targetFormat: VideoFormat;
  quality: VideoQuality;
}

export interface QualitySettings {
  bitrate: string;
  preset: string;
}

export const QUALITY_PRESETS: Record<VideoQuality, QualitySettings> = {
  low: { bitrate: '500k', preset: 'fast' },
  medium: { bitrate: '1000k', preset: 'medium' },
  high: { bitrate: '2500k', preset: 'slow' },
  ultra: { bitrate: '5000k', preset: 'slower' }
};
