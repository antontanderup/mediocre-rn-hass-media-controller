import { useEffect, useRef, useState } from 'react';
import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_INVALID_AUTH,
  type Connection,
} from 'home-assistant-js-websocket';
import type { HassAuthState, HassConfig } from '@/types';
import { buildHassUrl } from '@/utils';

export interface HassConnectionState {
  authState: HassAuthState;
  connection: Connection | null;
}

export const useHassConnection = (config: HassConfig | null): HassConnectionState => {
  const [authState, setAuthState] = useState<HassAuthState>('connecting');
  const [connection, setConnection] = useState<Connection | null>(null);
  const connectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    setAuthState('connecting');
    setConnection(null);

    const auth = createLongLivedTokenAuth(buildHassUrl(config), config.token);

    createConnection({ auth, setupRetry: 3 })
      .then(conn => {
        if (cancelled) {
          conn.close();
          return;
        }

        connectionRef.current = conn;
        setConnection(conn);
        setAuthState('authenticated');

        conn.addEventListener('disconnected', () => {
          if (!cancelled) setAuthState('error');
        });

        conn.addEventListener('ready', () => {
          if (!cancelled) setAuthState('authenticated');
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAuthState(err === ERR_INVALID_AUTH ? 'auth_invalid' : 'error');
      });

    return () => {
      cancelled = true;
      connectionRef.current?.close();
      connectionRef.current = null;
      setConnection(null);
    };
  }, [config]);

  return { authState, connection };
};
