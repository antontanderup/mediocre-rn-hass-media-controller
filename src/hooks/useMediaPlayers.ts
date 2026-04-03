import { useEffect, useState } from 'react';
import type { HassEntity, HassInboundMessage, HassResultMessage, MediaPlayerEntity } from '@/types';
import { isMediaPlayerEntity } from '@/utils';

export interface MediaPlayersState {
  players: MediaPlayerEntity[];
  isLoading: boolean;
}

/**
 * Derives the list of media_player entities from raw HASS WebSocket messages.
 * Pass in `lastMessage` from `useHassConnection`.
 */
export const useMediaPlayers = (lastMessage: HassInboundMessage | null): MediaPlayersState => {
  const [players, setPlayers] = useState<MediaPlayerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'result') {
      const result = lastMessage as HassResultMessage<HassEntity[]>;
      if (!result.success || !Array.isArray(result.result)) return;

      const mediaPlayers = result.result.filter(isMediaPlayerEntity);
      setPlayers(mediaPlayers);
      setIsLoading(false);
    } else if (lastMessage.type === 'event') {
      const { new_state } = lastMessage.event.data;
      if (!new_state || !isMediaPlayerEntity(new_state)) return;

      setPlayers(prev => {
        const idx = prev.findIndex(p => p.entity_id === new_state.entity_id);
        if (idx === -1) return [...prev, new_state];
        const next = [...prev];
        next[idx] = new_state;
        return next;
      });
    }
  }, [lastMessage]);

  return { players, isLoading };
};
