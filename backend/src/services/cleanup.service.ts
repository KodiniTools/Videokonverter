import fs from 'fs/promises';
import path from 'path';

// FIX Problem 4: Deutlich aggressivere Cleanup-Strategie
// Vorher: 30 Min Interval, 2 Std max Age = Dateien bleiben sehr lange
// Nachher: 5 Min Interval, 15 Min max Age = Schnelle Disk-Freigabe
const CLEANUP_INTERVAL = 5 * 60 * 1000;   // 5 minutes (war: 30 min)
const MAX_FILE_AGE = 15 * 60 * 1000;      // 15 minutes (war: 2 hours)
// Hinweis: Output-Dateien werden bereits nach Download gelöscht (convert.ts)
// Dieser Cleanup ist nur ein Fallback für vergessene/orphaned Dateien

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
