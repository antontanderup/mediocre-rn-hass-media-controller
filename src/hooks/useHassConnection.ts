import { useEffect, useRef, useState } from 'react';
import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_CANNOT_CONNECT,
  ERR_CONNECTION_LOST,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
  type Connection,
} from 'home-assistant-js-websocket';
import type { HassAuthState, HassConfig } from '@/types';
import { buildHassUrl } from '@/utils';

export interface HassConnectionState {
  authState: HassAuthState;
  connection: Connection | null;
  connectionErrorCode: number | null;
}

export const useHassConnection = (config: HassConfig | null): HassConnectionState => {
  const [authState, setAuthState] = useState<HassAuthState>('connecting');
  const [connection, setConnection] = useState<Connection | null>(null);
  const [connectionErrorCode, setConnectionErrorCode] = useState<number | null>(null);
  const connectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    setAuthState('connecting');
    setConnection(null);
    setConnectionErrorCode(null);

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
        setConnectionErrorCode(null);

        conn.addEventListener('disconnected', () => {
          if (!cancelled) {
            setAuthState('error');
            setConnectionErrorCode(ERR_CONNECTION_LOST);
          }
        });

        conn.addEventListener('ready', () => {
          if (!cancelled) {
            setAuthState('authenticated');
            setConnectionErrorCode(null);
          }
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = typeof err === 'number' ? err : null;
        setConnectionErrorCode(code);
        setAuthState(err === ERR_INVALID_AUTH ? 'auth_invalid' : 'error');
      });

    return () => {
      cancelled = true;
      connectionRef.current?.close();
      connectionRef.current = null;
      setConnection(null);
    };
  }, [config]);

  return { authState, connection, connectionErrorCode };
};

export { ERR_CANNOT_CONNECT, ERR_CONNECTION_LOST, ERR_INVALID_AUTH, ERR_INVALID_HTTPS_TO_HTTP };
