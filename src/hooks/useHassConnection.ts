import { useCallback, useEffect, useRef, useState } from 'react';
import type { HassAuthState, HassConfig, HassInboundMessage, HassOutboundMessage } from '@/types';

export interface HassConnectionState {
  authState: HassAuthState;
  send: (message: HassOutboundMessage) => void;
  lastMessage: HassInboundMessage | null;
}

let messageId = 1;
const nextId = (): number => messageId++;

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

    const { buildWsUrl } = require('@/utils');
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
        setAuthState('authenticated');
        // Subscribe to state_changed events
        ws.send(
          JSON.stringify({
            id: nextId(),
            type: 'subscribe_events',
            event_type: 'state_changed',
          }),
        );
        // Fetch initial states
        ws.send(JSON.stringify({ id: nextId(), type: 'get_states' }));
      } else if (msg.type === 'auth_invalid') {
        setAuthState('error');
      }
    };

    ws.onerror = () => setAuthState('error');
    ws.onclose = () => setAuthState('connecting');

    return () => {
      ws.close();
    };
  }, [config]);

  return { authState, send, lastMessage };
};
