import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { callService as hassCallService } from 'home-assistant-js-websocket';
import type { HassAuthState, HassConfig, HassEntity, MediaPlayerEntity } from '@/types';
import { useHassConfig, useHassConnection, useMediaPlayers } from '@/hooks';

interface HassContextValue {
  authState: HassAuthState;
  connectionErrorCode: number | null;
  entities: HassEntity[];
  players: MediaPlayerEntity[];
  isLoading: boolean;
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

const HassContext = createContext<HassContextValue | null>(null);

interface HassProviderProps {
  children: React.ReactNode;
}

export const HassProvider = ({ children }: HassProviderProps): React.JSX.Element => {
  const { config, isLoaded: isConfigLoaded, saveConfig, clearConfig } = useHassConfig();
  const { authState, connection, connectionErrorCode } = useHassConnection(config);
  const { entities, players, isLoading } = useMediaPlayers(connection);

  useEffect(() => {
    if (authState === 'auth_invalid') {
      clearConfig().catch(() => {
        // Non-fatal — token is already invalidated on the server side
      });
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
      hassCallService(connection, domain, service, serviceData, target).catch(() => {
        // Service call errors are non-fatal from the UI's perspective
      });
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

  const value = useMemo(
    () => ({ authState, connectionErrorCode, entities, players, isLoading, isConfigLoaded, hasConfig: config !== null, hassConfig: config, saveConfig, callService, sendMessage }),
    [authState, connectionErrorCode, entities, players, isLoading, isConfigLoaded, config, saveConfig, callService, sendMessage],
  );

  return <HassContext.Provider value={value}>{children}</HassContext.Provider>;
};

export const useHassContext = (): HassContextValue => {
  const ctx = useContext(HassContext);
  if (!ctx) {
    throw new Error('useHassContext must be used within a HassProvider');
  }
  return ctx;
};
