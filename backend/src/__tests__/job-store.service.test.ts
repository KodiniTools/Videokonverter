import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  addJob,
  addUploadedFile,
  jobs,
  removeStaleEntries,
  uploadedFiles,
} from '../services/job-store.service.js';

let tmpDir: string;

async function touch(name: string): Promise<string> {
  const p = path.join(tmpDir, name);
  await fs.writeFile(p, 'x');
  return p;
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'job-store-'));
  uploadedFiles.clear();
  jobs.clear();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('removeStaleEntries', () => {
  it('keeps entries whose files still exist', async () => {
    const input = await touch('upload-1.mp4');
    const output = await touch('output-2.webm');
    addUploadedFile('u1', { inputPath: input, originalName: 'a.mp4', fileSize: 1 });
    addJob('j2', { outputPath: output, format: 'webm', originalName: 'b.mp4' });

    const removed = await removeStaleEntries(() => false);

    expect(removed).toEqual([]);
    expect(uploadedFiles.has('u1')).toBe(true);
    expect(jobs.has('j2')).toBe(true);
  });

  it('drops an uploaded file whose input was deleted (e.g. by the cleanup service)', async () => {
    const input = await touch('upload-1.mp4');
    addUploadedFile('u1', { inputPath: input, originalName: 'a.mp4', fileSize: 1 });
    await fs.unlink(input);

    const removed = await removeStaleEntries(() => false);

    expect(removed).toEqual(['u1']);
    expect(uploadedFiles.size).toBe(0);
  });

  it('drops a finished job whose output is gone, but keeps a running one', async () => {
    addJob('running', {
      outputPath: path.join(tmpDir, 'not-written-yet.mp4'),
      format: 'mp4',
      originalName: 'r.mov',
    });
    addJob('downloaded', {
      outputPath: path.join(tmpDir, 'already-downloaded.mp4'),
      format: 'mp4',
      originalName: 'd.mov',
    });

    const removed = await removeStaleEntries((jobId) => jobId === 'running');

    expect(removed).toEqual(['downloaded']);
    expect(jobs.has('running')).toBe(true);
    expect(jobs.has('downloaded')).toBe(false);
  });

  it('is idempotent', async () => {
    addUploadedFile('u1', {
      inputPath: path.join(tmpDir, 'missing.mp4'),
      originalName: 'a.mp4',
      fileSize: 1,
    });

    expect(await removeStaleEntries(() => false)).toEqual(['u1']);
    expect(await removeStaleEntries(() => false)).toEqual([]);
  });
});
