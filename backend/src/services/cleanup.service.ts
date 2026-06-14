import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export class CleanupService {
  private intervalId?: NodeJS.Timeout;

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
  }
}
