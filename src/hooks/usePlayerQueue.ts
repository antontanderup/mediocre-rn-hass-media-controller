import { useMemo } from 'react';
import { useHassContext } from '@/context';
import type { QueueItem } from '@/types';
import { getHasMassFeatures, getIsLmsPlayer } from '@/utils';
import { useAppConfig } from './useAppConfig';
import { useHassMessagePromise } from './useHassMessagePromise';
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

  const playerConfig = appConfig?.mediaPlayers.find(p => p.entityId === entityId);
  const player = players.find(p => p.entity_id === entityId);

  const maEntityId = playerConfig?.maEntityId ?? entityId;
  const lmsEntityId = playerConfig?.lmsEntityId ?? entityId;

  // Step 1: detect entity IDs (pure checks, no network)
  const hasMaEntity = getHasMassFeatures(entityId, playerConfig?.maEntityId ?? null, players);
  const hasLmsEntity = playerConfig?.lmsEntityId
    ? getIsLmsPlayer(player ?? {}, playerConfig.lmsEntityId)
    : false;

  // Step 2: probe integration availability via actual service calls.
  // This is more reliable than checking config-entry domains, which may not
  // reflect real service reachability. The messages are identical to those
  // fired by useSqueezeboxQueue / useMassQueue, so the underlying cache in
  // getHassMessageWithCache means no duplicate network requests are made.

  // LMS probe — same serverstatus call used by useSqueezeboxQueue
  const { data: lmsProbeData, loading: lmsProbeLoading } = useHassMessagePromise<unknown>(
    {
      type: 'call_service',
      domain: 'lyrion_cli',
      service: 'query',
      service_data: { command: 'serverstatus', entity_id: lmsEntityId, parameters: ['-'] },
      return_response: true,
    },
    { enabled: hasLmsEntity, staleTime: 600000 },
  );

  // MA probe — same get_queue_items call used by useMassQueue
  const { data: maProbeData, loading: maProbeLoading } = useHassMessagePromise<unknown>(
    {
      type: 'call_service',
      domain: 'mass_queue',
      service: 'get_queue_items',
      service_data: { entity: maEntityId },
      return_response: true,
    },
    { enabled: hasMaEntity, staleTime: 30000 },
  );

  const isMA = hasMaEntity && !maProbeLoading && maProbeData !== null;
  // LMS only activates when MA is not the active backend for this entity
  const isLMS = hasLmsEntity && !lmsProbeLoading && lmsProbeData !== null;
  const loadingSupport = (hasMaEntity && maProbeLoading) || (hasLmsEntity && lmsProbeLoading);

  const maResult = useMassQueue(maEntityId, isMA);
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
