import { useCallback, useEffect, useMemo } from 'react';
import { useHassContext } from '@/context';
import type { QueueItem } from '@/types';
import { useHassMessagePromise } from './useHassMessagePromise';

type MassQueueItem = {
  queue_item_id: string;
  media_title: string;
  media_album_name?: string;
  media_artist?: string;
  media_content_id?: string;
  media_image?: string;
};

type MassQueueResponse = {
  [entityId: string]: MassQueueItem[];
};

export type MassQueueResult = {
  queue: QueueItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearQueue: () => void;
};

export const useMassQueue = (entityId: string, enabled: boolean): MassQueueResult => {
  const { players, callService } = useHassContext();
  const player = players.find(p => p.entity_id === entityId);

  const { data, loading, error, refetch } = useHassMessagePromise<MassQueueResponse>(
    {
      type: 'call_service',
      domain: 'mass_queue',
      service: 'get_queue_items',
      service_data: { entity: entityId },
      return_response: true,
    },
    { enabled, staleTime: 30000 },
  );

  const skipToItem = useCallback(
    async (queueItemId: string) => {
      callService('mass_queue', 'play_queue_item', { entity: entityId, queue_item_id: queueItemId });
    },
    [callService, entityId],
  );

  const deleteItem = useCallback(
    async (queueItemId: string) => {
      callService('mass_queue', 'remove_queue_item', {
        entity: entityId,
        queue_item_id: queueItemId,
      });
      refetch();
    },
    [callService, entityId, refetch],
  );

  const moveItemUp = useCallback(
    async (queueItemId: string) => {
      callService('mass_queue', 'move_queue_item_up', {
        entity: entityId,
        queue_item_id: queueItemId,
      });
      // Small delay to allow backend to process before refetching
      await new Promise(resolve => setTimeout(resolve, 100));
      refetch();
    },
    [callService, entityId, refetch],
  );

  const moveItemDown = useCallback(
    async (queueItemId: string) => {
      callService('mass_queue', 'move_queue_item_down', {
        entity: entityId,
        queue_item_id: queueItemId,
      });
      await new Promise(resolve => setTimeout(resolve, 100));
      refetch();
    },
    [callService, entityId, refetch],
  );

  const clearQueue = useCallback(() => {
    callService('media_player', 'clear_playlist', undefined, { entity_id: entityId });
    refetch();
  }, [callService, entityId, refetch]);

  const currentTitle = player?.attributes.media_title;

  const queue = useMemo<QueueItem[]>(() => {
    const rawItems = data as MassQueueResponse | null;
    const items =
      rawItems?.[entityId]?.map((item, index, array) => ({
        id: item.queue_item_id,
        title: item.media_title,
        artist: item.media_artist,
        album: item.media_album_name,
        artworkUrl: item.media_image,
        isFirst: index === 0,
        isLast: index === array.length - 1,
        playlistIndex: index,
        isPlaying: currentTitle === item.media_title,
        skipToItem: () => skipToItem(item.queue_item_id),
        deleteItem: () => deleteItem(item.queue_item_id),
        moveItemUp: () => moveItemUp(item.queue_item_id),
        moveItemDown: () => moveItemDown(item.queue_item_id),
      })) ?? [];

    // Return all items from the currently playing item onward.
    // MA sometimes returns items before the playing item due to a backend bug.
    const isPlayingIndex = items.findIndex(item => item.isPlaying);
    return items.slice(isPlayingIndex >= 0 ? isPlayingIndex : 0);
  }, [data, entityId, currentTitle, skipToItem, deleteItem, moveItemUp, moveItemDown]);

  // Refetch whenever the playing track changes
  useEffect(() => {
    if (!data) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTitle]);

  return useMemo(
    () => ({ queue, loading, error, refetch, clearQueue }),
    [queue, loading, error, refetch, clearQueue],
  );
};
