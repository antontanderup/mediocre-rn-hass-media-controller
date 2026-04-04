import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { HassAuthState, HassOutboundMessage, MediaPlayerEntity } from '@/types';
import { useHassConfig, useHassConnection, useMediaPlayers } from '@/hooks';

interface HassContextValue {
  authState: HassAuthState;
  players: MediaPlayerEntity[];
  isLoading: boolean;
  isConfigLoaded: boolean;
  hasConfig: boolean;
  send: (msg: HassOutboundMessage) => void;
}

const HassContext = createContext<HassContextValue | null>(null);

interface HassProviderProps {
  children: React.ReactNode;
}

export const HassProvider = ({ children }: HassProviderProps): React.JSX.Element => {
  const { config, isLoaded: isConfigLoaded, clearConfig } = useHassConfig();
  const { authState, send, lastMessage } = useHassConnection(config);
  const { players, isLoading } = useMediaPlayers(lastMessage);

  useEffect(() => {
    if (authState === 'auth_invalid') {
      clearConfig().catch(() => {
        // Non-fatal — token is already invalidated on the server side
      });
    }
  }, [authState, clearConfig]);

  const value = useMemo(
    () => ({ authState, players, isLoading, isConfigLoaded, hasConfig: config !== null, send }),
    [authState, players, isLoading, isConfigLoaded, config, send],
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
