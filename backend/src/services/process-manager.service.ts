import { ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface JobProcess {
  process: ChildProcess;
  jobId: string;
  inputPath: string;
  outputPath: string;
  startTime: number;
  timeout?: NodeJS.Timeout;
}

export class ProcessManagerService {
  private activeProcesses = new Map<string, JobProcess>();
  private readonly DEFAULT_TIMEOUT = 60 * 60 * 1000; // 1 Stunde

  /**
   * Registriert einen neuen ffmpeg-Prozess
   */
  register(
    jobId: string,
    process: ChildProcess,
    inputPath: string,
    outputPath: string,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): void {
    console.log(`[ProcessManager] ✅ Register job: ${jobId}`);

    // Timeout-Protection: Prozess nach X Zeit killen
    const timeout = setTimeout(() => {
      console.log(`[ProcessManager] ⏱️ Timeout reached for job: ${jobId}`);
      this.kill(jobId, 'timeout');
    }, timeoutMs);

    this.activeProcesses.set(jobId, {
      process,
      jobId,
      inputPath,
      outputPath,
      startTime: Date.now(),
      timeout
    });

    console.log(`[ProcessManager] Active processes: ${this.activeProcesses.size}`);
  }

  /**
   * Entfernt einen Prozess aus der Registry
   */
  unregister(jobId: string): void {
    const job = this.activeProcesses.get(jobId);
    if (job) {
      // Timeout clearen
      if (job.timeout) {
        clearTimeout(job.timeout);
      }
      this.activeProcesses.delete(jobId);
      console.log(`[ProcessManager] ✅ Unregister job: ${jobId}`);
      console.log(`[ProcessManager] Active processes: ${this.activeProcesses.size}`);
    }
  }

  /**
   * Killt einen spezifischen Job
   */
  async kill(jobId: string, reason: string = 'user_request'): Promise<boolean> {
    const job = this.activeProcesses.get(jobId);
    if (!job) {
      console.log(`[ProcessManager] ❌ Job not found: ${jobId}`);
      return false;
    }

    console.log(`[ProcessManager] 🔪 Killing job ${jobId} (reason: ${reason})`);

    try {
      // Graceful termination versuchen
      job.process.kill('SIGTERM');

      // Nach 5 Sekunden forcen falls noch läuft
      setTimeout(() => {
        if (!job.process.killed) {
          console.log(`[ProcessManager] 💥 Force kill job: ${jobId}`);
          job.process.kill('SIGKILL');
        }
      }, 5000);

      // Cleanup der Dateien
      await this.cleanupFiles(job);

      // Aus Registry entfernen
      this.unregister(jobId);

      return true;
    } catch (error) {
      console.error(`[ProcessManager] ❌ Error killing job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Killt alle aktiven Prozesse (für Graceful Shutdown)
   */
  async killAll(): Promise<void> {
    console.log(`[ProcessManager] 🛑 Killing all ${this.activeProcesses.size} active processes...`);

    const killPromises: Promise<boolean>[] = [];

    for (const [jobId] of this.activeProcesses) {
      killPromises.push(this.kill(jobId, 'shutdown'));
    }

    await Promise.all(killPromises);

    // 10 Sekunden warten für graceful termination
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Force-Kill verbleibende Prozesse
    for (const [jobId, job] of this.activeProcesses) {
      if (!job.process.killed) {
        console.log(`[ProcessManager] 💥 Force killing remaining job: ${jobId}`);
        job.process.kill('SIGKILL');
      }
    }

    this.activeProcesses.clear();
    console.log('[ProcessManager] ✅ All processes killed');
  }

  /**
   * Cleanup Input/Output Dateien für einen Job
   */
  async cleanupFiles(job: JobProcess): Promise<void> {
    console.log(`[ProcessManager] 🧹 Cleanup files for job: ${job.jobId}`);

    // Input-Datei löschen
    try {
      await fs.unlink(job.inputPath);
      console.log(`[ProcessManager] ✅ Deleted input: ${job.inputPath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`[ProcessManager] ❌ Error deleting input:`, error);
      }
    }

    // Output-Datei löschen (nur bei Abbruch/Fehler)
    try {
      await fs.unlink(job.outputPath);
      console.log(`[ProcessManager] ✅ Deleted output: ${job.outputPath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`[ProcessManager] ❌ Error deleting output:`, error);
      }
    }
  }

  /**
   * Auto-Cleanup nur Input-Datei (nach erfolgreicher Konvertierung)
   */
  async cleanupInput(jobId: string): Promise<void> {
    const job = this.activeProcesses.get(jobId);
    if (!job) return;

    console.log(`[ProcessManager] 🧹 Cleanup input for completed job: ${jobId}`);

    try {
      await fs.unlink(job.inputPath);
      console.log(`[ProcessManager] ✅ Deleted input: ${job.inputPath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`[ProcessManager] ❌ Error deleting input:`, error);
      }
    }
  }

  /**
   * Gibt Info über aktive Prozesse zurück
   */
  getActiveProcesses(): Array<{ jobId: string; runtime: number }> {
    const now = Date.now();
    return Array.from(this.activeProcesses.values()).map(job => ({
      jobId: job.jobId,
      runtime: now - job.startTime
    }));
  }

  /**
   * Prüft ob ein Job aktiv ist
   */
  isActive(jobId: string): boolean {
    return this.activeProcesses.has(jobId);
  }

  /**
   * Zombie-Process Detection beim Server-Start
   */
  async detectAndKillZombies(): Promise<void> {
    console.log('[ProcessManager] 🧟 Checking for zombie ffmpeg processes...');

    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // Finde alle laufenden ffmpeg-Prozesse
      try {
        const { stdout } = await execAsync('pgrep -f "ffmpeg.*output-"');
        const pids = stdout.trim().split('\n').filter(pid => pid);

        if (pids.length > 0) {
          console.log(`[ProcessManager] ⚠️ Found ${pids.length} zombie ffmpeg processes`);

          // Alle Zombie-Prozesse killen
          for (const pid of pids) {
            try {
              await execAsync(`kill -15 ${pid}`);
              console.log(`[ProcessManager] 🔪 Killed zombie process: ${pid}`);
            } catch (error) {
              console.error(`[ProcessManager] ❌ Error killing zombie ${pid}:`, error);
            }
          }

          // Nach 5 Sekunden Force-Kill
          await new Promise(resolve => setTimeout(resolve, 5000));
          for (const pid of pids) {
            try {
              await execAsync(`kill -9 ${pid} 2>/dev/null`);
            } catch {
              // Prozess bereits tot
            }
          }
        } else {
          console.log('[ProcessManager] ✅ No zombie processes found');
        }
      } catch (error: any) {
        // pgrep findet nichts = keine Zombies = gut
        if (error.code === 1) {
          console.log('[ProcessManager] ✅ No zombie processes found');
        } else {
          throw error;
        }
      }

      // Cleanup alte temp-Dateien
      await this.cleanupOldTempFiles();

    } catch (error) {
      console.error('[ProcessManager] ❌ Error in zombie detection:', error);
    }
  }

  /**
   * Cleanup alte temporäre Dateien beim Start
   */
  private async cleanupOldTempFiles(): Promise<void> {
    console.log('[ProcessManager] 🧹 Cleaning up old temp files...');

    const directories = ['uploads', 'outputs'];
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 Stunden
    const now = Date.now();

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stats = await fs.stat(filePath);
            const age = now - stats.mtimeMs;

            if (age > MAX_AGE) {
              await fs.unlink(filePath);
              console.log(`[ProcessManager] 🗑️ Deleted old file: ${filePath} (${Math.round(age / 1000 / 60 / 60)}h old)`);
            }
          } catch (error) {
            // Datei bereits gelöscht oder nicht zugreifbar
          }
        }
      } catch (error) {
        console.error(`[ProcessManager] ❌ Error cleaning ${dir}:`, error);
      }
    }

    console.log('[ProcessManager] ✅ Temp file cleanup complete');
  }
}
