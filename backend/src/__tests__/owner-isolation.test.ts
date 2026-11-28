import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import router from '../routes/convert.js';
import { jobs, uploadedFiles } from '../services/job-store.service.js';
import { newOwnerToken, readOwner } from '../services/owner.service.js';

let server: Server;
let base = '';
let tmpDir = '';
const alice = newOwnerToken();
const bob = newOwnerToken();
const JOB = '11111111-2222-4333-8444-555555555555';

const call = (url: string, owner: string | null, init: RequestInit = {}) =>
  fetch(base + url, {
    ...init,
    headers: { ...(owner ? { cookie: `vk_owner=${owner}` } : {}), ...(init.headers ?? {}) },
  });

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.close();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

beforeEach(async () => {
  uploadedFiles.clear();
  jobs.clear();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'owner-'));
  const output = path.join(tmpDir, `output-${JOB}.mp4`);
  await fs.writeFile(output, 'video');
  jobs.set(JOB, { outputPath: output, format: 'mp4', originalName: 'urlaub.mov', owner: alice });
});

describe('readOwner', () => {
  it('liest nur gültige Tokens', () => {
    expect(readOwner(`a=1; vk_owner=${alice}`)).toBe(alice);
    expect(readOwner('vk_owner=../etc')).toBeNull();
    expect(readOwner(undefined)).toBeNull();
  });
});

describe('Aufträge sind an den Browser gebunden', () => {
  it('GET /jobs zeigt nur eigene Aufträge', async () => {
    const own = (await (await call('/api/jobs', alice)).json()) as { jobs: { jobId: string }[] };
    expect(own.jobs.map((j) => j.jobId)).toEqual([JOB]);
    const other = (await (await call('/api/jobs', bob)).json()) as { jobs: unknown[] };
    expect(other.jobs).toEqual([]);
    const anonymous = (await (await call('/api/jobs', null)).json()) as { jobs: unknown[] };
    expect(anonymous.jobs).toEqual([]);
  });

  it('setzt ein HttpOnly-Cookie, wenn noch keins vorhanden ist', async () => {
    const res = await call('/api/jobs', null);
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(readOwner(cookie.split(';')[0])).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  it('fremder Download und fremdes Löschen schlagen fehl, eigener Download klappt', async () => {
    expect((await call(`/api/download/${JOB}`, bob)).status).toBe(404);
    await call(`/api/jobs/${JOB}`, bob, { method: 'DELETE' });
    expect(jobs.has(JOB)).toBe(true);

    const res = await call(`/api/download/${JOB}`, alice);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('video');
  });

  it('fremde Konvertierung wird abgelehnt, ungültige Formate ebenso', async () => {
    uploadedFiles.set(JOB, {
      inputPath: path.join(tmpDir, 'in.mov'),
      originalName: 'urlaub.mov',
      fileSize: 1,
      owner: alice,
    });
    jobs.clear();
    const post = (owner: string, body: object) =>
      call(`/api/convert/${JOB}`, owner, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect((await post(bob, { targetFormat: 'mp4', quality: 'high' })).status).toBe(404);
    expect((await post(alice, { targetFormat: 'mp4/../../x', quality: 'high' })).status).toBe(400);
    expect((await post(alice, { targetFormat: 'mp4', quality: 'extrem' })).status).toBe(400);
    expect(uploadedFiles.has(JOB)).toBe(true);
  });
});
