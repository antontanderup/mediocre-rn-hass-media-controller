import { useEffect, useState } from 'react';
import { subscribeEntities, type Connection } from 'home-assistant-js-websocket';
import type { HassEntity, MediaPlayerEntity } from '@/types';
import { isMediaPlayerEntity } from '@/utils';

export interface MediaPlayersState {
  entities: HassEntity[];
  players: MediaPlayerEntity[];
  isLoading: boolean;
}

/**
 * Subscribes to all Home Assistant entities and derives the list of
 * media_player entities. Automatically stays in sync with state changes.
 */
export const useMediaPlayers = (connection: Connection | null): MediaPlayersState => {
  const [entities, setEntities] = useState<HassEntity[]>([]);
  const [players, setPlayers] = useState<MediaPlayerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!connection) {
      setEntities([]);
      setPlayers([]);
      setIsLoading(true);
      return;
    }

    let cancelled = false;

    const unsubscribe = subscribeEntities(connection, allEntities => {
      if (cancelled) return;
      const all = Object.values(allEntities) as HassEntity[];
      setEntities(all);
      setPlayers(all.filter(isMediaPlayerEntity));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [connection]);

  return { entities, players, isLoading };
};
