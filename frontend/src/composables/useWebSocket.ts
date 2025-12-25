import { ref, onMounted, onUnmounted } from 'vue';
import type { ProgressUpdate } from '@/types/conversion';

// Dynamische WebSocket-URL basierend auf dem aktuellen Host
function getWebSocketUrl(): string {
  // Explizite Konfiguration hat Vorrang
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // In Entwicklung: localhost
  if (import.meta.env.DEV) {
    return 'ws://localhost:3000';
  }

  // In Production: Dynamisch basierend auf aktuellem Host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const apiPath = import.meta.env.VITE_API_URL || '';
  return `${protocol}//${host}${apiPath}`;
}

export function useWebSocket(onProgress: (update: ProgressUpdate) => void) {
  const ws = ref<WebSocket | null>(null);
  const connected = ref(false);
  const error = ref<string | null>(null);

  function connect() {
    try {
      const wsUrl = getWebSocketUrl();
      console.log('[WS] Connecting to:', wsUrl);
      ws.value = new WebSocket(wsUrl);

      ws.value.onopen = () => {
        connected.value = true;
        error.value = null;
        console.log('[WS] Connected');
      };

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ProgressUpdate;
          onProgress(data);
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.value.onerror = (event) => {
        error.value = 'WebSocket connection error';
        console.error('[WS] Error:', event);
      };

      ws.value.onclose = () => {
        connected.value = false;
        console.log('[WS] Disconnected');
        
        // Reconnect nach 3s
        setTimeout(() => {
          if (!ws.value || ws.value.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 3000);
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Connection failed';
    }
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
  }

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    connected,
    error,
    disconnect
  };
}
