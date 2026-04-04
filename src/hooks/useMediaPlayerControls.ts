import { useCallback, useRef } from 'react';
import { useHassContext } from '@/context';

export interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (level: number) => void;
}

export const useMediaPlayerControls = (entityId: string): MediaPlayerControls => {
  const { callService } = useHassContext();
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
    (level: number) => call('volume_set', { volume_level: level }),
    [call],
  );

  return { play, pause, nextTrack, previousTrack, setVolume };
};
