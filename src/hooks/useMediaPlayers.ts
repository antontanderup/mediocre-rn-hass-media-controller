import { useEffect, useState } from 'react';
import type { HassEntity, HassWsConnection, MediaPlayerEntity } from '@/types';
import { isMediaPlayerEntity } from '@/utils';

export interface MediaPlayersState {
  players: MediaPlayerEntity[];
  isLoading: boolean;
}

/**
 * Subscribes to all Home Assistant entities and derives the list of
 * media_player entities. Automatically stays in sync with state changes.
 */
export const useMediaPlayers = (connection: HassWsConnection | null): MediaPlayersState => {
  const [players, setPlayers] = useState<MediaPlayerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!connection) {
      setPlayers([]);
      setIsLoading(true);
      return;
    }

    let cancelled = false;

    const unsubscribe = connection.subscribeEntities(entities => {
      if (cancelled) return;
      const mediaPlayers = (Object.values(entities) as HassEntity[]).filter(isMediaPlayerEntity);
      setPlayers(mediaPlayers);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [connection]);

  return { players, isLoading };
};
