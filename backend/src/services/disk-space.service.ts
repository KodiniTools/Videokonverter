import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from '../config.js';

const execPromise = promisify(exec);

export class DiskSpaceService {
  async checkAvailableSpace(requiredGB: number): Promise<boolean> {
    try {
      // Linux: df command
      const { stdout } = await execPromise(`df -BG ${config.upload.outputDir} | tail -1`);
      const parts = stdout.trim().split(/\s+/);
      const availableGB = parseInt(parts[3].replace('G', ''));

      return availableGB > requiredGB * 2; // 2x buffer
    } catch {
      console.warn('[DiskSpace] ⚠️ Could not check disk space, denying as precaution');
      return false;
    }
  }
}
