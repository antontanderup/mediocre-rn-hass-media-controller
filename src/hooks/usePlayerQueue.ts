import { useMemo } from 'react';
import { useHassContext } from '@/context';
import type { QueueItem } from '@/types';
import { getHasQueueSupport } from '@/utils';
import { useAppConfig } from './useAppConfig';
import { useConfigEntries } from './useConfigEntries';
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
  /** True while integration availability is still being determined. */
  loadingSupport: boolean;
  isMA: boolean;
  isLMS: boolean;
};

export const usePlayerQueue = (entityId: string): UsePlayerQueueResult => {
  const { players } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const loadedDomains = useConfigEntries();

  const playerConfig = appConfig?.mediaPlayers.find(p => p.entityId === entityId);

  const queueSupport = useMemo(() => {
    if (loadedDomains === null) return null; // still loading
    return getHasQueueSupport(entityId, playerConfig, players, loadedDomains);
  }, [entityId, playerConfig, players, loadedDomains]);

  const isMA = queueSupport?.isMA ?? false;
  const isLMS = queueSupport?.isLMS ?? false;
  const loadingSupport = loadedDomains === null;

  const maEntityId = playerConfig?.maEntityId ?? entityId;
  const lmsEntityId = playerConfig?.lmsEntityId ?? entityId;

  const maResult = useMassQueue(maEntityId, isMA);
  // LMS only activates when MA is not the active backend for this entity
  const lmsResult = useSqueezeboxQueue(lmsEntityId, isLMS && !isMA);

  const active = isMA ? maResult : lmsResult;

  const notConfigured = !playerConfig?.maEntityId && !playerConfig?.lmsEntityId;

  return useMemo(
    () => ({
      ...active,
      isAvailable: isMA || isLMS,
      notConfigured,
      loadingSupport,
      isMA,
      isLMS,
    }),
    [active, isMA, isLMS, notConfigured, loadingSupport],
  );
};
