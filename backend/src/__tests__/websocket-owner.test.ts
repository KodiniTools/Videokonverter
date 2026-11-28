import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'http';
import type { AddressInfo } from 'net';
import { WebSocket } from 'ws';
import { broadcastProgress, initWebSocket } from '../websocket.js';
import { jobs } from '../services/job-store.service.js';
import { newOwnerToken } from '../services/owner.service.js';

const server = http.createServer();
const alice = newOwnerToken();
const bob = newOwnerToken();
let url = '';

const connect = (owner: string): Promise<{ ws: WebSocket; messages: unknown[] }> =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers: { cookie: `vk_owner=${owner}` } });
    const messages: unknown[] = [];
    ws.on('message', (m) => messages.push(JSON.parse(String(m))));
    ws.on('open', () => resolve({ ws, messages }));
    ws.on('error', reject);
  });

beforeAll(async () => {
  initWebSocket(server);
  await new Promise<void>((r) => server.listen(0, r));
  url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe('broadcastProgress', () => {
  it('sendet Fortschritt nur an den Besitzer des Auftrags', async () => {
    jobs.set('job-a', { outputPath: '/x', format: 'mp4', originalName: 'a.mp4', owner: alice });
    const a = await connect(alice);
    const b = await connect(bob);
    broadcastProgress({ jobId: 'job-a', progress: 50, status: 'processing' });
    broadcastProgress({ jobId: 'unbekannt', progress: 1, status: 'processing' });
    await new Promise((r) => setTimeout(r, 100));
    expect(a.messages).toEqual([{ jobId: 'job-a', progress: 50, status: 'processing' }]);
    expect(b.messages).toEqual([]);
    a.ws.close();
    b.ws.close();
    jobs.clear();
  });
});
