import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { callService as hassCallService } from 'home-assistant-js-websocket';
import type { HassAuthState, HassConfig, HassEntity, MediaPlayerEntity } from '@/types';
import { useHassConfig, useHassConnection, useMediaPlayers } from '@/hooks';

// Stable API values — only change on connect/disconnect or config save.
// Components subscribing here are NOT re-rendered by entity state updates.
interface HassApiContextValue {
  authState: HassAuthState;
  connectionErrorCode: number | null;
  isConfigLoaded: boolean;
  hasConfig: boolean;
  hassConfig: HassConfig | null;
  saveConfig: (c: HassConfig) => Promise<void>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id?: string | string[] },
  ) => void;
  sendMessage: <T>(message: { type: string } & Record<string, unknown>) => Promise<T>;
}

// Frequently-updating entity state — changes on every HA entity event.
// Only subscribe here if you need live entity data.
interface HassEntitiesContextValue {
  entities: HassEntity[];
  players: MediaPlayerEntity[];
  isLoading: boolean;
}

const HassApiContext = createContext<HassApiContextValue | null>(null);
const HassEntitiesContext = createContext<HassEntitiesContextValue | null>(null);

interface HassProviderProps {
  children: React.ReactNode;
}

export const HassProvider = ({ children }: HassProviderProps): React.JSX.Element => {
  const { config, isLoaded: isConfigLoaded, saveConfig, clearConfig } = useHassConfig();
  const { authState, connection, connectionErrorCode } = useHassConnection(config);
  const { entities, players, isLoading } = useMediaPlayers(connection);

  useEffect(() => {
    if (authState === 'auth_invalid') {
      clearConfig().catch(() => {});
    }
  }, [authState, clearConfig]);

  const callService = useCallback(
    (
      domain: string,
      service: string,
      serviceData?: Record<string, unknown>,
      target?: { entity_id?: string | string[] },
    ) => {
      if (!connection) return;
      hassCallService(connection, domain, service, serviceData, target).catch(() => {});
    },
    [connection],
  );

  const sendMessage = useCallback(
    <T,>(message: { type: string } & Record<string, unknown>): Promise<T> => {
      if (!connection) return Promise.reject(new Error('Not connected'));
      return connection.sendMessagePromise(message) as Promise<T>;
    },
    [connection],
  );

  const apiValue = useMemo<HassApiContextValue>(
    () => ({
      authState,
      connectionErrorCode,
      isConfigLoaded,
      hasConfig: config !== null,
      hassConfig: config,
      saveConfig,
      callService,
      sendMessage,
    }),
    [authState, connectionErrorCode, isConfigLoaded, config, saveConfig, callService, sendMessage],
  );

  const entitiesValue = useMemo<HassEntitiesContextValue>(
    () => ({ entities, players, isLoading }),
    [entities, players, isLoading],
  );

  return (
    <HassApiContext.Provider value={apiValue}>
      <HassEntitiesContext.Provider value={entitiesValue}>
        {children}
      </HassEntitiesContext.Provider>
    </HassApiContext.Provider>
  );
};

export const useHassContext = (): HassApiContextValue => {
  const ctx = useContext(HassApiContext);
  if (!ctx) throw new Error('useHassContext must be used within a HassProvider');
  return ctx;
};

export const useHassEntities = (): HassEntitiesContextValue => {
  const ctx = useContext(HassEntitiesContext);
  if (!ctx) throw new Error('useHassEntities must be used within a HassProvider');
  return ctx;
};
