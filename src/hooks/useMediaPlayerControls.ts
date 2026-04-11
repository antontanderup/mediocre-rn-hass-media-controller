import { useCallback, useRef } from 'react';
import { useHassContext } from '@/context';
import { useAppConfig } from '@/hooks/useAppConfig';
import type { MediaPlayerConfig } from '@/types';

export interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (level: number, syncGroup?: boolean) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'off' | 'one' | 'all') => void;
  setSource: (source: string) => void;
  turnOn: () => void;
}

export const useMediaPlayerControls = (entityId: string): MediaPlayerControls => {
  const { callService, players } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;

  const call = useCallback(
    (service: string, serviceData?: Record<string, unknown>) => {
      callService('media_player', service, serviceData, { entity_id: entityIdRef.current });
    },
    [callService],
  );

  const play = useCallback(() => call('media_play'), [call]);
  const pause = useCallback(() => call('media_pause'), [call]);
  const nextTrack = useCallback(() => call('media_next_track'), [call]);
  const previousTrack = useCallback(() => call('media_previous_track'), [call]);
  const setVolume = useCallback(
    (level: number, syncGroup?: boolean) => {
      call('volume_set', { volume_level: level });

      if (!syncGroup) return;

      const playerConfig = appConfig?.mediaPlayers.find(
        (p: MediaPlayerConfig) => p.entityId === entityIdRef.current,
      );
      const groupEntityId = playerConfig?.speakerGroupEntityId ?? entityIdRef.current;
      const groupEntity = players.find(p => p.entity_id === groupEntityId);
      const groupMembers = groupEntity?.attributes.group_members ?? [];
      if (groupMembers.length <= 1) return;

      const oldMainVolume = groupEntity?.attributes.volume_level ?? 0;
      const volumeRatio = oldMainVolume > 0 ? level / oldMainVolume : 1;

      groupMembers.slice(1).forEach((memberId: string) => {
        const member = players.find(p => p.entity_id === memberId);
        if (!member) return;
        const memberVolume = member.attributes.volume_level ?? 0;
        const newMemberVolume = Math.min(Math.max(memberVolume * volumeRatio, 0), 1);
        callService('media_player', 'volume_set', { volume_level: newMemberVolume }, { entity_id: memberId });
      });
    },
    [call, callService, players, appConfig],
  );
  const setShuffle = useCallback(
    (shuffle: boolean) => call('shuffle_set', { shuffle }),
    [call],
  );
  const setRepeat = useCallback(
    (repeat: 'off' | 'one' | 'all') => call('repeat_set', { repeat }),
    [call],
  );
  const setSource = useCallback(
    (source: string) => call('select_source', { source }),
    [call],
  );
  const turnOn = useCallback(() => call('turn_on'), [call]);

  return { play, pause, nextTrack, previousTrack, setVolume, setShuffle, setRepeat, setSource, turnOn };
};
