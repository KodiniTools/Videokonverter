import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ConversionJob, ConversionSettings, ProgressUpdate, VideoFormat, VideoQuality } from '@/types/conversion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

export const useConversionStore = defineStore('conversion', () => {
  const jobs = ref<ConversionJob[]>([]);
  const settings = ref<ConversionSettings>({
    targetFormat: 'mp4',
    quality: 'high'
  });

  const activeJobs = computed(() =>
    jobs.value.filter(j => j.status === 'uploading' || j.status === 'pending' || j.status === 'processing')
  );

  const completedJobs = computed(() =>
    jobs.value.filter(j => j.status === 'completed')
  );

  const uploadedJobs = computed(() =>
    jobs.value.filter(j => j.status === 'uploaded')
  );

  // Nur Upload - ohne Konvertierung
  async function uploadFile(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Datei zu groß. Max: ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB`);
    }

    const jobId = crypto.randomUUID();
    const job: ConversionJob = {
      id: jobId,
      fileName: file.name,
      fileSize: file.size,
      sourceFormat: file.name.split('.').pop() || 'unknown',
      targetFormat: settings.value.targetFormat,
      quality: settings.value.quality,
      status: 'uploading',
      progress: 0,
      createdAt: Date.now()
    };

    jobs.value.push(job);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('jobId', jobId);
    formData.append('originalName', file.name);

    try {
      // XMLHttpRequest für Upload-Progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const uploadProgress = Math.round((e.loaded / e.total) * 100);
            updateJob(jobId, { progress: uploadProgress });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            updateJob(jobId, {
              status: 'uploaded',
              progress: 100,
              uploadedFilePath: response.filePath
            });
            resolve();
          } else {
            reject(new Error(`Upload fehlgeschlagen: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload-Fehler')));
        xhr.addEventListener('abort', () => reject(new Error('Upload abgebrochen')));

        xhr.open('POST', `${API_URL}/api/upload`);
        xhr.send(formData);
      });

      return jobId;
    } catch (error) {
      updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload fehlgeschlagen'
      });
      throw error;
    }
  }

  // Konvertierung starten für bereits hochgeladene Datei
  async function startConversion(jobId: string, targetFormat: VideoFormat, quality: VideoQuality): Promise<void> {
    const job = jobs.value.find(j => j.id === jobId);
    if (!job || job.status !== 'uploaded') {
      throw new Error('Job nicht gefunden oder nicht bereit');
    }

    // Job aktualisieren mit gewähltem Format
    updateJob(jobId, {
      status: 'pending',
      targetFormat,
      quality,
      progress: 0
    });

    try {
      const response = await fetch(`${API_URL}/api/convert/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetFormat, quality })
      });

      if (!response.ok) {
        throw new Error(`Konvertierung fehlgeschlagen: ${response.status}`);
      }

      updateJob(jobId, { status: 'processing' });
    } catch (error) {
      updateJob(jobId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Konvertierung fehlgeschlagen'
      });
      throw error;
    }
  }

  function updateJob(jobId: string, updates: Partial<ConversionJob>) {
    const job = jobs.value.find(j => j.id === jobId);
    if (job) {
      Object.assign(job, updates);
    }
  }

  function handleProgressUpdate(update: ProgressUpdate) {
    updateJob(update.jobId, {
      progress: update.progress,
      status: update.status,
      error: update.error,
      downloadUrl: update.downloadUrl,
      convertedFileSize: update.convertedFileSize
    });
  }

  function removeJob(jobId: string) {
    const index = jobs.value.findIndex(j => j.id === jobId);
    if (index !== -1) {
      jobs.value.splice(index, 1);
    }
  }

  function setSettings(newSettings: Partial<ConversionSettings>) {
    settings.value = { ...settings.value, ...newSettings };
  }

  async function downloadFile(job: ConversionJob) {
    if (!job.downloadUrl) return;

    const link = document.createElement('a');
    link.href = `${API_URL}${job.downloadUrl}`;
    link.download = `${job.fileName.split('.')[0]}.${job.targetFormat}`;
    link.click();
  }

  return {
    jobs,
    settings,
    activeJobs,
    completedJobs,
    uploadedJobs,
    uploadFile,
    startConversion,
    updateJob,
    handleProgressUpdate,
    removeJob,
    setSettings,
    downloadFile
  };
});
