import fs from 'fs/promises';
import path from 'path';

const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_AGE = 2 * 60 * 60 * 1000; // 2 hours

export class CleanupService {
  private intervalId?: NodeJS.Timeout;

  start() {
    console.log('[Cleanup] Service started');
    this.intervalId = setInterval(() => this.cleanup(), CLEANUP_INTERVAL);
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
    const dirs = ['uploads', 'outputs'];

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > MAX_FILE_AGE) {
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
