import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { jobs } from './services/job-store.service.js';
import { readOwner } from './services/owner.service.js';

let wss: WebSocketServer;
/** Verbundene Browser mit ihrem Besitzer-Token (aus dem Cookie beim Verbindungsaufbau). */
const clients = new Map<WebSocket, string | null>();

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected');
    clients.set(ws, readOwner(req.headers.cookie));

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[WS] Error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

/**
 * Sendet eine Fortschrittsmeldung nur an die Browser, denen der Auftrag gehört.
 * Meldungen ohne bekannten Auftrag werden verworfen.
 */
export function broadcastProgress(data: { jobId: string } & Record<string, unknown>) {
  const owner = jobs.get(data.jobId)?.owner;
  if (!owner) return;
  const message = JSON.stringify(data);

  clients.forEach((clientOwner, client) => {
    if (clientOwner === owner && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
