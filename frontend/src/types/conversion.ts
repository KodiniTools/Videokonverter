export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv' | 'ts';
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ConversionStatus = 'uploading' | 'uploaded' | 'pending' | 'processing' | 'completed' | 'error';

export interface ConversionJob {
  id: string;
  fileName: string;
  fileSize: number;
  sourceFormat: string;
  targetFormat: VideoFormat;
  quality: VideoQuality;
  status: ConversionStatus;
  progress: number;
  error?: string;
  downloadUrl?: string;
  uploadedFilePath?: string;
  createdAt: number;
}

export interface ConversionSettings {
  targetFormat: VideoFormat;
  quality: VideoQuality;
  resolution?: string;
}

export interface ProgressUpdate {
  jobId: string;
  progress: number;
  status: ConversionStatus;
  error?: string;
  downloadUrl?: string;
}
