import { useCallback, useMemo, useState } from 'react';
import { useHassContext } from '@/context';
import { useAppConfig } from '@/hooks';
import type { MediaPlayerConfig } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroupableSpeaker {
  entityId: string;
  name: string;
  volume: number;
  isMuted: boolean;
  isOff: boolean;
  isGrouped: boolean;
  isMainSpeaker: boolean;
  isLoading: boolean;
}

export interface GroupingState {
  mainEntityId: string;
  groupedSpeakers: GroupableSpeaker[];
  ungroupedSpeakers: GroupableSpeaker[];
  hasGroupableEntities: boolean;
  toggleGroup: (speakerId: string, isGrouped: boolean) => void;
  setVolume: (entityId: string, volume: number) => void;
  setMuted: (entityId: string, isMuted: boolean) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGrouping = (entityId: string): GroupingState => {
  const { players, callService } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const playerConfig = useMemo(
    () => appConfig?.mediaPlayers.find((p: MediaPlayerConfig) => p.entityId === entityId) ?? null,
    [appConfig, entityId],
  );

  // The effective HA entity used for group coordination (may differ from entityId)
  const mainEntityId = playerConfig?.speakerGroupEntityId ?? entityId;

  const mainEntity = useMemo(
    () => players.find(p => p.entity_id === mainEntityId) ?? null,
    [players, mainEntityId],
  );

  const groupableConfigs = useMemo(
    () => appConfig?.mediaPlayers.filter((p: MediaPlayerConfig) => p.canBeGrouped) ?? [],
    [appConfig],
  );

  const speakers = useMemo((): GroupableSpeaker[] => {
    if (!groupableConfigs.length) return [];
    const groupMembers = mainEntity?.attributes.group_members ?? [];

    return groupableConfigs
      .map((cfg: MediaPlayerConfig) => {
        const speakerEntityId = cfg.speakerGroupEntityId ?? cfg.entityId;
        const player = players.find(p => p.entity_id === speakerEntityId);
        if (!player) return null;
        const isMainSpeaker = speakerEntityId === mainEntityId;
        return {
          entityId: speakerEntityId,
          name: cfg.name ?? player.attributes.friendly_name ?? speakerEntityId,
          volume: typeof player.attributes.volume_level === 'number' ? player.attributes.volume_level : 0,
          isMuted: player.attributes.is_volume_muted === true,
          isOff: player.state === 'off',
          isGrouped: isMainSpeaker || groupMembers.includes(speakerEntityId),
          isMainSpeaker,
          isLoading: loadingIds.includes(speakerEntityId),
        };
      })
      .filter((s: GroupableSpeaker | null): s is GroupableSpeaker => s !== null)
      .sort((a: GroupableSpeaker, b: GroupableSpeaker) => {
        if (a.entityId === mainEntityId) return -1;
        if (b.entityId === mainEntityId) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [groupableConfigs, players, mainEntity, mainEntityId, loadingIds]);

  const groupedSpeakers = useMemo(
    () => speakers.filter((s: GroupableSpeaker) => s.isGrouped),
    [speakers],
  );
  const ungroupedSpeakers = useMemo(
    () => speakers.filter((s: GroupableSpeaker) => !s.isGrouped),
    [speakers],
  );

  const toggleGroup = useCallback(
    (speakerId: string, isGrouped: boolean) => {
      if (loadingIds.includes(speakerId)) return;
      setLoadingIds((prev: string[]) => [...prev, speakerId]);

      if (isGrouped) {
        callService('media_player', 'unjoin', undefined, { entity_id: speakerId });
      } else {
        const speaker = players.find(p => p.entity_id === speakerId);
        if (speaker?.state === 'off') {
          callService('media_player', 'turn_on', undefined, { entity_id: speakerId });
        }
        const existingMembers = (mainEntity?.attributes.group_members ?? []).filter(
          (id: string) => id !== mainEntityId,
        );
        callService(
          'media_player',
          'join',
          { group_members: [speakerId, ...existingMembers] },
          { entity_id: mainEntityId },
        );
      }

      // Clear loading after HA state update has had time to propagate
      setTimeout(() => {
        setLoadingIds((prev: string[]) => prev.filter((id: string) => id !== speakerId));
      }, 2000);
    },
    [loadingIds, callService, players, mainEntity, mainEntityId],
  );

  const setVolume = useCallback(
    (speakerId: string, volume: number) => {
      callService('media_player', 'volume_set', { volume_level: volume }, { entity_id: speakerId });
    },
    [callService],
  );

  const setMuted = useCallback(
    (speakerId: string, isMuted: boolean) => {
      callService(
        'media_player',
        'volume_mute',
        { is_volume_muted: !isMuted },
        { entity_id: speakerId },
      );
    },
    [callService],
  );

  return {
    mainEntityId,
    groupedSpeakers,
    ungroupedSpeakers,
    hasGroupableEntities: groupableConfigs.length > 0,
    toggleGroup,
    setVolume,
    setMuted,
  };
};
