import { useCallback, useMemo } from 'react';
import { useHassContext, useHassEntities, useSelectedPlayerContext } from '@/context';
import { getHasMassFeatures, getIsLmsPlayer } from '@/utils';
import { useAppConfig } from './useAppConfig';

export type TransferTarget = {
  entityId: string;
  label: string;
};

export type UseTransferQueueResult = {
  /** Players this queue can be transferred to. Empty when transfer is not supported. */
  targets: TransferTarget[];
  /** Transfer the current queue to the given target entity ID and switch to that player. */
  transferQueue: (targetEntityId: string) => void;
};

export const useTransferQueue = (entityId: string): UseTransferQueueResult => {
  const { callService } = useHassContext();
  const { players } = useHassEntities();
  const { config: appConfig } = useAppConfig();
  const { setEntityId } = useSelectedPlayerContext();

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

  // LMS transfer is only used when MA is not the active backend
  const activeIsLMS = isLMS && !isMA;

  const targets = useMemo((): TransferTarget[] => {
    if (!isMA && !activeIsLMS) return [];
    if (!appConfig) return [];

    return appConfig.mediaPlayers
      .filter(mp => {
        if (mp.entityId === entityId) return false;
        if (isMA && !mp.maEntityId) return false;
        if (activeIsLMS && !mp.lmsEntityId) return false;
        const livePlayer = players.find(p => p.entity_id === mp.entityId);
        if (!livePlayer || livePlayer.state === 'unavailable') return false;
        return true;
      })
      .map(mp => {
        const livePlayer = players.find(p => p.entity_id === mp.entityId);
        return {
          entityId: mp.entityId,
          label: mp.name ?? livePlayer?.attributes.friendly_name ?? mp.entityId,
        };
      });
  }, [isMA, activeIsLMS, entityId, appConfig, players]);

  const transferQueue = useCallback(
    (targetEntityId: string) => {
      const targetConfig = appConfig?.mediaPlayers.find(p => p.entityId === targetEntityId);

      if (isMA) {
        const sourceMA = playerConfig?.maEntityId ?? entityId;
        const targetMA = targetConfig?.maEntityId ?? targetEntityId;
        callService(
          'music_assistant',
          'transfer_queue',
          { source_player: sourceMA },
          { entity_id: targetMA },
        );
      } else if (activeIsLMS) {
        const sourceLMS = playerConfig?.lmsEntityId ?? entityId;
        const targetLMS = targetConfig?.lmsEntityId ?? targetEntityId;
        callService('media_player', 'join', { group_members: [targetLMS] }, { entity_id: sourceLMS });
        callService('media_player', 'turn_off', {}, { entity_id: sourceLMS });
        callService('media_player', 'turn_on', {}, { entity_id: targetLMS });
        callService('media_player', 'media_play', {}, { entity_id: targetLMS });
        callService('media_player', 'unjoin', {}, { entity_id: sourceLMS });
      }

      setEntityId(targetEntityId);
    },
    [isMA, activeIsLMS, playerConfig, entityId, appConfig, callService, setEntityId],
  );

  return { targets, transferQueue };
};
