import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { removeStaleEntries } from './job-store.service.js';

export class CleanupService {
  private intervalId?: NodeJS.Timeout;

  /**
   * @param isJobActive returns true while a conversion is still running –
   *   its registry entry must survive even though the output is not complete yet
   */
  constructor(private readonly isJobActive: (jobId: string) => boolean = () => false) {}

  start() {
    console.log('[Cleanup] Service started');
    this.intervalId = setInterval(() => this.cleanup(), config.cleanup.intervalMs);
    this.cleanup(); // Initial cleanup
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('[Cleanup] Service stopped');
    }
  }

  private async cleanup() {
    const now = Date.now();
    const dirs = [config.upload.uploadDir, config.upload.outputDir];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > config.cleanup.maxAgeMs) {
            await fs.unlink(filePath);
            console.log(`[Cleanup] Deleted: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`[Cleanup] Error in ${dir}:`, error);
      }
    }

    // Files are gone → forget the jobs too, otherwise GET /api/jobs keeps
    // returning them until the next server restart.
    try {
      await removeStaleEntries(this.isJobActive);
    } catch (error) {
      console.error('[Cleanup] Error removing stale jobs:', error);
    }
  }
}
