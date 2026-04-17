import { useCallback, useMemo, useRef } from 'react';
import { useHassEntities, useSelectedPlayerContext } from '@/context';
import { useAppConfig } from './useAppConfig';
import type { MediaPlayerConfig, MediaPlayerEntity } from '@/types';

export interface SelectedPlayerState {
  /** The entity ID of the currently selected player. */
  entityId: string | undefined;
  /** The MediaPlayerConfig for the selected player, if one is configured. */
  config: MediaPlayerConfig | undefined;
  /** The live MediaPlayerEntity for the selected player, if available. */
  player: MediaPlayerEntity | undefined;
  /** Switch to a different player by entity ID. */
  setSelectedPlayer: (entityId: string) => void;
  /** Record a user interaction to suppress automatic player switching. */
  setLastInteraction: () => void;
  /** Timestamp (ms) of the last user interaction, or null. */
  lastInteractionRef: React.RefObject<number | null>;
}

export const useSelectedPlayer = (): SelectedPlayerState => {
  const { entityId, setEntityId } = useSelectedPlayerContext();
  const { players } = useHassEntities();
  const { config: appConfig } = useAppConfig();
  const lastInteractionRef = useRef<number | null>(null);

  const playerConfig = useMemo(
    () => appConfig?.mediaPlayers.find(p => p.entityId === entityId),
    [appConfig, entityId],
  );

  const player = useMemo(
    () => players.find(p => p.entity_id === entityId),
    [players, entityId],
  );

  const setSelectedPlayer = useCallback(
    (newEntityId: string) => {
      setEntityId(newEntityId);
    },
    [setEntityId],
  );

  const setLastInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  return {
    entityId,
    config: playerConfig,
    player,
    setSelectedPlayer,
    setLastInteraction,
    lastInteractionRef,
  };
};
