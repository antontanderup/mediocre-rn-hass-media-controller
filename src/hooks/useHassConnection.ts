import { useEffect, useRef, useState } from 'react';
import {
  connectToHass,
  ERR_CANNOT_CONNECT,
  ERR_CONNECTION_LOST,
  ERR_INVALID_AUTH,
  ERR_INVALID_HTTPS_TO_HTTP,
} from '@/utils';
import type { HassAuthState, HassConfig, HassWsConnection } from '@/types';

export interface HassConnectionState {
  authState: HassAuthState;
  connection: HassWsConnection | null;
  connectionErrorCode: number | null;
}

export const useHassConnection = (config: HassConfig | null): HassConnectionState => {
  const [authState, setAuthState] = useState<HassAuthState>('connecting');
  const [connection, setConnection] = useState<HassWsConnection | null>(null);
  const [connectionErrorCode, setConnectionErrorCode] = useState<number | null>(null);
  const closeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    setAuthState('connecting');
    setConnection(null);
    setConnectionErrorCode(null);

    const close = connectToHass(
      config,
      conn => {
        if (cancelled) {
          conn.close();
          return;
        }
        setConnection(conn);
        setAuthState('authenticated');
        setConnectionErrorCode(null);
      },
      () => {
        if (cancelled) return;
        setAuthState('auth_invalid');
        setConnectionErrorCode(ERR_INVALID_AUTH);
      },
      (code: number) => {
        if (cancelled) return;
        setConnectionErrorCode(code);
        setAuthState('error');
      },
    );

    closeRef.current = close;

    return () => {
      cancelled = true;
      closeRef.current?.();
      closeRef.current = null;
      setConnection(null);
    };
  }, [config]);

  return { authState, connection, connectionErrorCode };
};

export { ERR_CANNOT_CONNECT, ERR_CONNECTION_LOST, ERR_INVALID_AUTH, ERR_INVALID_HTTPS_TO_HTTP };
