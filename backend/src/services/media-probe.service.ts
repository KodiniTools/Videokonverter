import { execFile } from 'child_process';

/**
 * Parse an ffmpeg/ffprobe timestamp ("HH:MM:SS" or "HH:MM:SS.ms") into seconds.
 */
export function parseTimestamp(value: string): number | null {
  const m = value.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d+))?$/);
  if (!m) return null;
  const [, h, min, s, frac] = m;
  const seconds = parseInt(h, 10) * 3600 + parseInt(min, 10) * 60 + parseInt(s, 10);
  return frac ? seconds + parseFloat(`0.${frac}`) : seconds;
}

/**
 * Extract the input duration from an ffmpeg stderr chunk.
 * Returns null when it is missing or reported as "N/A" (e.g. WebM recordings
 * from the browser MediaRecorder carry no duration in the header).
 */
export function parseDurationFromStderr(output: string): number | null {
  const m = output.match(/Duration:\s*(\d+:\d{2}:\d{2}(?:\.\d+)?)/);
  return m ? parseTimestamp(m[1]) : null;
}

/**
 * Extract the last "time=HH:MM:SS.ms" value (processed position) from an ffmpeg
 * stderr chunk.
 */
export function parseProcessedTimeFromStderr(output: string): number | null {
  const matches = output.match(/time=(\d+:\d{2}:\d{2}(?:\.\d+)?)/g);
  if (!matches) return null;
  const last = matches[matches.length - 1].slice('time='.length);
  return parseTimestamp(last);
}

/**
 * Percentage (0–99) of processed vs. total duration. 100 is reserved for the
 * completed event.
 */
export function computeProgress(processedSeconds: number, durationSeconds: number): number {
  if (!(durationSeconds > 0) || !(processedSeconds >= 0)) return 0;
  return Math.min(Math.round((processedSeconds / durationSeconds) * 100), 99);
}

/** Parse the output of `ffprobe -show_entries format=duration`. */
export function parseProbeDuration(stdout: string): number | null {
  const value = parseFloat(stdout.trim());
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Parse the output of `ffprobe -show_entries packet=pts_time` (one pts per
 * line) and return the largest timestamp, i.e. the effective duration.
 */
export function parseLastPacketTime(stdout: string): number | null {
  let max = -1;
  for (const line of stdout.split('\n')) {
    const value = parseFloat(line.trim());
    if (Number.isFinite(value) && value > max) max = value;
  }
  return max > 0 ? max : null;
}

function runFFprobe(args: string[], maxBuffer: number): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('ffprobe', args, { maxBuffer }, (error, stdout) => {
      if (error) return reject(error);
      resolve(stdout);
    });
  });
}

/**
 * Determine the duration of an input file in seconds.
 *
 * 1. Fast path: container duration from the header (`format=duration`).
 * 2. Fallback for files without a duration in the header (MediaRecorder WebM,
 *    truncated files): scan the packets of the first video stream (demux
 *    only, no decoding) and use the last timestamp.
 *
 * Resolves to null when neither works; never rejects.
 */
export async function probeDuration(inputPath: string): Promise<number | null> {
  try {
    const out = await runFFprobe(
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', inputPath],
      1024 * 1024
    );
    const duration = parseProbeDuration(out);
    if (duration) return duration;
  } catch (err) {
    console.warn(`[Probe] format=duration failed for ${inputPath}: ${(err as Error).message}`);
  }

  try {
    const out = await runFFprobe(
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'packet=pts_time',
        '-of',
        'csv=p=0',
        inputPath,
      ],
      256 * 1024 * 1024 // one line per packet; large files have many packets
    );
    const duration = parseLastPacketTime(out);
    if (duration) {
      console.log(`[Probe] Duration from packet scan: ${duration.toFixed(2)}s (${inputPath})`);
      return duration;
    }
  } catch (err) {
    console.warn(`[Probe] packet scan failed for ${inputPath}: ${(err as Error).message}`);
  }

  return null;
}
