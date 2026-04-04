import { useCallback, useRef } from 'react';
import { useHassContext } from '@/context';

let messageId = 1000;
const nextId = (): number => messageId++;

export interface MediaPlayerControls {
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (level: number) => void;
}

export const useMediaPlayerControls = (entityId: string): MediaPlayerControls => {
  const { send } = useHassContext();
  const entityIdRef = useRef(entityId);
  entityIdRef.current = entityId;

  const callService = useCallback(
    (service: string, serviceData?: Record<string, unknown>) => {
      send({
        id: nextId(),
        type: 'call_service',
        domain: 'media_player',
        service,
        target: { entity_id: entityIdRef.current },
        ...(serviceData ? { service_data: serviceData } : {}),
      });
    },
    [send],
  );

  const play = useCallback(() => callService('media_play'), [callService]);
  const pause = useCallback(() => callService('media_pause'), [callService]);
  const nextTrack = useCallback(() => callService('media_next_track'), [callService]);
  const previousTrack = useCallback(() => callService('media_previous_track'), [callService]);
  const setVolume = useCallback(
    (level: number) => callService('volume_set', { volume_level: level }),
    [callService],
  );

  return { play, pause, nextTrack, previousTrack, setVolume };
};
