import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class DiskSpaceService {
  async checkAvailableSpace(requiredGB: number): Promise<boolean> {
    try {
      // Linux: df command
      const { stdout } = await execPromise('df -BG . | tail -1');
      const parts = stdout.trim().split(/\s+/);
      const availableGB = parseInt(parts[3].replace('G', ''));
      
      return availableGB > requiredGB * 2; // 2x buffer
    } catch (error) {
      console.error('[DiskSpace] Check failed:', error);
      return true; // Fail-open
    }
  }
}
