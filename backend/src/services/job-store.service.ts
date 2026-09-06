import fs from 'fs/promises';
import { config } from '../config.js';

/**
 * In-memory registry of everything the server currently knows about.
 *
 * - `uploadedFiles`: uploaded, not yet converted (input file in uploads/)
 * - `jobs`:          conversion started / finished (output file in outputs/)
 *
 * Both maps only live in RAM. Files on disk, however, are removed by the
 * CleanupService (after `config.cleanup.maxAgeMs`) or by a download. Without
 * `removeStaleEntries()` such "ghost" entries would stay in the maps until the
 * next server restart and reappear in the frontend on every page reload.
 */

export interface UploadedFile {
  inputPath: string;
  originalName: string;
  fileSize: number;
}

export interface ConversionJob {
  outputPath: string;
  format: string;
  originalName: string;
}

export const uploadedFiles = new Map<string, UploadedFile>();
export const jobs = new Map<string, ConversionJob>();

/** Add an uploaded file, evicting the oldest entry when the size limit is reached. */
export function addUploadedFile(jobId: string, fileData: UploadedFile): void {
  if (uploadedFiles.size >= config.jobs.maxUploadedFiles) {
    const firstKey = uploadedFiles.keys().next().value;
    if (firstKey) {
      uploadedFiles.delete(firstKey);
      console.log(`[Upload] ⚠️  Map limit reached, removed oldest: ${firstKey}`);
    }
  }
  uploadedFiles.set(jobId, fileData);
}

/** Add a conversion job, evicting the oldest entry when the size limit is reached. */
export function addJob(jobId: string, jobData: ConversionJob): void {
  if (jobs.size >= config.jobs.maxJobs) {
    const firstKey = jobs.keys().next().value;
    if (firstKey) {
      jobs.delete(firstKey);
      console.log(
        `[Jobs] ⚠️  Map limit reached (${config.jobs.maxJobs}), removed oldest: ${firstKey}`
      );
    }
  }
  jobs.set(jobId, jobData);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Drop registry entries whose file no longer exists on disk.
 *
 * A job whose conversion is still running is skipped: its output file is being
 * written and may not be visible yet.
 *
 * @param isActive returns true while ffmpeg is still running for the given job
 * @returns the ids that were removed
 */
export async function removeStaleEntries(isActive: (jobId: string) => boolean): Promise<string[]> {
  const removed: string[] = [];

  for (const [jobId, file] of Array.from(uploadedFiles.entries())) {
    if (!(await fileExists(file.inputPath))) {
      uploadedFiles.delete(jobId);
      removed.push(jobId);
    }
  }

  for (const [jobId, job] of Array.from(jobs.entries())) {
    if (isActive(jobId)) continue;
    if (!(await fileExists(job.outputPath))) {
      jobs.delete(jobId);
      removed.push(jobId);
    }
  }

  if (removed.length > 0) {
    console.log(
      `[Jobs] 🧹 Removed ${removed.length} stale entr${removed.length === 1 ? 'y' : 'ies'}: ${removed.join(', ')}`
    );
  }

  return removed;
}
