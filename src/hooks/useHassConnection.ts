import { useCallback, useEffect, useRef, useState } from 'react';
import type { HassAuthState, HassConfig, HassInboundMessage, HassOutboundMessage } from '@/types';
import { buildWsUrl } from '@/utils';

export interface HassConnectionState {
  authState: HassAuthState;
  send: (message: HassOutboundMessage) => void;
  lastMessage: HassInboundMessage | null;
}

let messageId = 1;
const nextId = (): number => messageId++;

const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

export const useHassConnection = (config: HassConfig | null): HassConnectionState => {
  const wsRef = useRef<WebSocket | null>(null);
  const [authState, setAuthState] = useState<HassAuthState>('connecting');
  const [lastMessage, setLastMessage] = useState<HassInboundMessage | null>(null);

  const send = useCallback((message: HassOutboundMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!config) return;

    // Refs that survive across reconnects within this effect
    const isAuthInvalidRef = { current: false };
    const reconnectDelayRef = { current: BACKOFF_INITIAL_MS };
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = (): void => {
      if (cancelled) return;

      const ws = new WebSocket(buildWsUrl(config));
      wsRef.current = ws;
      setAuthState('connecting');

      ws.onmessage = (event: MessageEvent<string>) => {
        const msg = JSON.parse(event.data) as HassInboundMessage;
        setLastMessage(msg);

        if (msg.type === 'auth_required') {
          setAuthState('authenticating');
          ws.send(JSON.stringify({ type: 'auth', access_token: config.token }));
        } else if (msg.type === 'auth_ok') {
          // Reset backoff on successful auth
          reconnectDelayRef.current = BACKOFF_INITIAL_MS;
          setAuthState('authenticated');
          ws.send(
            JSON.stringify({
              id: nextId(),
              type: 'subscribe_events',
              event_type: 'state_changed',
            }),
          );
          ws.send(JSON.stringify({ id: nextId(), type: 'get_states' }));
        } else if (msg.type === 'auth_invalid') {
          isAuthInvalidRef.current = true;
          setAuthState('auth_invalid');
        }
      };

      ws.onerror = () => setAuthState('error');

      ws.onclose = () => {
        if (cancelled || isAuthInvalidRef.current) return;

        // Keep authState as 'error' during the backoff window so the UI can
        // show an error banner. connect() will reset it to 'connecting' when
        // the next attempt actually starts.
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, BACKOFF_MAX_MS);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [config]);

  return { authState, send, lastMessage };
};
