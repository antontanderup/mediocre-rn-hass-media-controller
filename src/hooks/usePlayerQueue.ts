import { useMemo } from 'react';
import { useHassContext } from '@/context';
import type { QueueItem } from '@/types';
import { getHasMassFeatures, getIsLmsPlayer } from '@/utils';
import { useAppConfig } from './useAppConfig';
import { useMassQueue } from './useMassQueue';
import { useSqueezeboxQueue } from './useSqueezeboxQueue';

export type UsePlayerQueueResult = {
  queue: QueueItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearQueue: () => void;
  isAvailable: boolean;
  /** True when neither MA nor LMS entity IDs have been configured for this player. */
  notConfigured: boolean;
  isMA: boolean;
  isLMS: boolean;
};

export const usePlayerQueue = (entityId: string): UsePlayerQueueResult => {
  const { players } = useHassContext();
  const { config: appConfig } = useAppConfig();

  const player = players.find(p => p.entity_id === entityId);
  const playerConfig = appConfig?.mediaPlayers.find(p => p.entityId === entityId);

  const isMA = useMemo(
    () => getHasMassFeatures(entityId, playerConfig?.maEntityId ?? null, players),
    [entityId, playerConfig?.maEntityId, players],
  );

  const isLMS = useMemo(
    () =>
      playerConfig?.lmsEntityId
        ? getIsLmsPlayer(player ?? {}, playerConfig.lmsEntityId)
        : false,
    [player, playerConfig?.lmsEntityId],
  );

  const maEntityId = playerConfig?.maEntityId ?? entityId;
  const lmsEntityId = playerConfig?.lmsEntityId ?? entityId;

  const maResult = useMassQueue(maEntityId, isMA);
  // LMS only activates when MA is not the active backend for this entity
  const lmsResult = useSqueezeboxQueue(lmsEntityId, isLMS && !isMA);

  const active = isMA ? maResult : lmsResult;

  const notConfigured = !playerConfig?.maEntityId && !playerConfig?.lmsEntityId;

  return useMemo(
    () => ({ ...active, isAvailable: isMA || isLMS, notConfigured, isMA, isLMS }),
    [active, isMA, isLMS, notConfigured],
  );
};
