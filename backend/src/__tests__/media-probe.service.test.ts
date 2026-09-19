import { describe, expect, it } from 'vitest';
import {
  computeProgress,
  parseDurationFromStderr,
  parseLastPacketTime,
  parseProbeDuration,
  parseProcessedTimeFromStderr,
  parseTimestamp,
} from '../services/media-probe.service.js';

describe('parseTimestamp', () => {
  it('parses HH:MM:SS and fractional seconds', () => {
    expect(parseTimestamp('00:01:30')).toBe(90);
    expect(parseTimestamp('01:00:00.50')).toBe(3600.5);
    expect(parseTimestamp('123:00:01')).toBe(123 * 3600 + 1);
  });

  it('rejects garbage', () => {
    expect(parseTimestamp('N/A')).toBeNull();
    expect(parseTimestamp('')).toBeNull();
  });
});

describe('parseDurationFromStderr', () => {
  it('reads the duration line ffmpeg prints for normal inputs', () => {
    const chunk =
      'Input #0, mov,mp4\n  Duration: 00:02:05.12, start: 0.000000, bitrate: 1200 kb/s\n';
    expect(parseDurationFromStderr(chunk)).toBeCloseTo(125.12, 2);
  });

  it('returns null for MediaRecorder WebM ("Duration: N/A")', () => {
    const chunk = 'Input #0, matroska,webm\n  Duration: N/A, start: 0.000000, bitrate: N/A\n';
    expect(parseDurationFromStderr(chunk)).toBeNull();
  });
});

describe('parseProcessedTimeFromStderr', () => {
  it('takes the last time= value in a chunk', () => {
    const chunk =
      'frame= 10 fps=0.0 q=20.0 size=1kB time=00:00:01.00 bitrate=8.0kbits/s\r' +
      'frame= 60 fps=59 q=20.0 size=90kB time=00:00:03.50 bitrate=210kbits/s\r';
    expect(parseProcessedTimeFromStderr(chunk)).toBe(3.5);
  });

  it('ignores chunks without progress', () => {
    expect(parseProcessedTimeFromStderr('Stream mapping:\n')).toBeNull();
  });
});

describe('computeProgress', () => {
  it('caps at 99 until completion and handles unknown duration', () => {
    expect(computeProgress(50, 100)).toBe(50);
    expect(computeProgress(100, 100)).toBe(99);
    expect(computeProgress(120, 100)).toBe(99);
    expect(computeProgress(10, 0)).toBe(0);
    expect(computeProgress(10, NaN)).toBe(0);
  });
});

describe('ffprobe output parsing', () => {
  it('parses format=duration', () => {
    expect(parseProbeDuration('125.480000\n')).toBeCloseTo(125.48, 3);
    expect(parseProbeDuration('N/A\n')).toBeNull();
    expect(parseProbeDuration('')).toBeNull();
  });

  it('uses the largest packet pts as duration', () => {
    expect(parseLastPacketTime('0.000000\n0.033000\n0.066000\n12.500000\n')).toBe(12.5);
    expect(parseLastPacketTime('N/A\nN/A\n')).toBeNull();
    expect(parseLastPacketTime('')).toBeNull();
  });
});
