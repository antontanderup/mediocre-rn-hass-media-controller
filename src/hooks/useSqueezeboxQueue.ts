import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHassContext } from '@/context';
import type {
  QueueItem,
  SqueezeboxServerStatusResponse,
  SqueezeboxStatusResponse,
  SqueezeboxSonginfoResponse,
  SqueezeboxSongInfoLoopItem,
} from '@/types';
import { getHassMessageWithCache } from '@/utils';
import { useHassMessagePromise } from './useHassMessagePromise';

export type SqueezeboxQueueResult = {
  queue: QueueItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  clearQueue: () => void;
};

export const useSqueezeboxQueue = (entityId: string, enabled: boolean): SqueezeboxQueueResult => {
  const { players, callService, sendMessage } = useHassContext();
  const player = players.find(p => p.entity_id === entityId);

  const { data: serverData } = useHassMessagePromise<SqueezeboxServerStatusResponse>(
    {
      type: 'call_service',
      domain: 'lyrion_cli',
      service: 'query',
      service_data: { command: 'serverstatus', entity_id: entityId, parameters: ['-'] },
      return_response: true,
    },
    { enabled, staleTime: 600000 },
  );

  const { data, loading, error, refetch } = useHassMessagePromise<SqueezeboxStatusResponse>(
    {
      type: 'call_service',
      domain: 'lyrion_cli',
      service: 'query',
      service_data: { command: 'status', entity_id: entityId, parameters: ['-'] },
      return_response: true,
    },
    { enabled: enabled && !!serverData, staleTime: 30000 },
  );

  const moveItem = useCallback(
    async (fromIndex: number, toIndex: number) => {
      callService('lyrion_cli', 'method', {
        command: 'playlist',
        entity_id: entityId,
        parameters: ['move', fromIndex, toIndex],
      });
      refetch();
    },
    [callService, entityId, refetch],
  );

  const skipToItem = useCallback(
    async (index: number) => {
      callService('lyrion_cli', 'method', {
        command: 'playlist',
        entity_id: entityId,
        parameters: ['index', index],
      });
    },
    [callService, entityId],
  );

  const deleteItem = useCallback(
    async (index: number) => {
      callService('lyrion_cli', 'method', {
        command: 'playlist',
        entity_id: entityId,
        parameters: ['delete', index],
      });
      refetch();
    },
    [callService, entityId, refetch],
  );

  const clearQueue = useCallback(() => {
    callService('media_player', 'clear_playlist', undefined, { entity_id: entityId });
    refetch();
  }, [callService, entityId, refetch]);

  const [queue, setQueue] = useState<QueueItem[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const populateQueueInfo = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!data?.playlist_loop) return;

      const currentIndex = data.playlist_cur_index != null ? Number(data.playlist_cur_index) : -1;

      let newQueue: QueueItem[] = data.playlist_loop.map((item, index) => ({
        id: item.id,
        title: item.title,
        artist: '-',
        playlistIndex: item['playlist index'],
        isPlaying: item['playlist index'] === currentIndex,
        isFirst: index === 0,
        isLast: index === data.playlist_loop!.length - 1,
        moveItem: (toIndex: number) => moveItem(item['playlist index'], toIndex),
        skipToItem: () => skipToItem(item['playlist index']),
        deleteItem: () => deleteItem(item['playlist index']),
      }));

      // Show only upcoming tracks (exclude currently playing and earlier)
      newQueue = newQueue
        .slice(newQueue.findIndex(i => !i.isPlaying))
        .filter(item => !item.isPlaying);

      // Optimistically show the queue before artwork loads
      if (queue.length === 0) setQueue(newQueue);

      const enriched: QueueItem[] = [];
      for (const item of newQueue) {
        let enrichedItem: QueueItem = item;
        try {
          const songInfoResult = await getHassMessageWithCache<{
            response?: SqueezeboxSonginfoResponse;
          }>(
            {
              type: 'call_service',
              domain: 'lyrion_cli',
              service: 'query',
              service_data: {
                command: 'songinfo',
                entity_id: entityId,
                parameters: [0, 100, `track_id:${item.id}`],
              },
              return_response: true,
            },
            sendMessage,
            { staleTime: 86400000 },
          );

          const loop = songInfoResult?.response?.songinfo_loop;
          if (loop && loop.length > 0) {
            const info = Object.assign({}, ...loop) as SqueezeboxSongInfoLoopItem;
            enrichedItem = {
              ...enrichedItem,
              album: info.album,
              artist: info.artist,
            };
            const rootPath = `http://${serverData?.ip}:${serverData?.httpport}`;
            if (info.artwork_url && data.player_ip) {
              enrichedItem = { ...enrichedItem, artworkUrl: `${rootPath}${info.artwork_url}` };
            } else if (info.artwork_track_id) {
              enrichedItem = {
                ...enrichedItem,
                artworkUrl: `${rootPath}/music/${info.artwork_track_id}/cover_50x50_o`,
              };
            }
          }
        } catch {
          // Non-fatal — item shows without artwork/metadata
        }
        enriched.push(enrichedItem);
      }

      setQueue(enriched);
    }, 250);
  }, [data, entityId, moveItem, skipToItem, deleteItem, queue, serverData, sendMessage]);

  useEffect(() => {
    populateQueueInfo();
  }, [data, populateQueueInfo]);

  const currentTitle = player?.attributes.media_title;

  // Refetch when the playing track changes
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
