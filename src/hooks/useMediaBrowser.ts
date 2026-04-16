import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHassContext } from '@/context';
import type { HaMediaItem, MediaBrowserNode, HaEnqueueMode } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNode(raw: HaMediaItem): MediaBrowserNode {
  return {
    title: raw.title,
    mediaContentId: raw.media_content_id,
    mediaContentType: raw.media_content_type,
    mediaClass: raw.media_class,
    canPlay: raw.can_play,
    canExpand: raw.can_expand,
    thumbnail: raw.thumbnail,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseMediaBrowserResult {
  items: MediaBrowserNode[];
  history: MediaBrowserNode[];
  loading: boolean;
  error: string | null;
  browse: (node: MediaBrowserNode) => void;
  goBack: () => void;
  goToRoot: () => void;
  goToIndex: (index: number) => void;
  playItem: (node: MediaBrowserNode, enqueue?: HaEnqueueMode) => void;
}

export function useMediaBrowser(entityId: string): UseMediaBrowserResult {
  const { sendMessage, callService } = useHassContext();

  const [items, setItems] = useState<MediaBrowserNode[]>([]);
  const [history, setHistory] = useState<MediaBrowserNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against stale responses when history changes rapidly
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (!entityId) return;

    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    const current = history[history.length - 1];
    const message: Record<string, unknown> & { type: string } = {
      type: 'media_player/browse_media',
      entity_id: entityId,
      ...(current
        ? {
            media_content_id: current.mediaContentId,
            media_content_type: current.mediaContentType,
          }
        : {}),
    };

    sendMessage<{ children?: HaMediaItem[] }>(message)
      .then(response => {
        if (fetchIdRef.current !== id) return; // stale
        setItems(response?.children?.map(toNode) ?? []);
      })
      .catch((e: unknown) => {
        if (fetchIdRef.current !== id) return;
        setError(
          e && typeof e === 'object' && 'message' in e
            ? (e as Error).message
            : 'Failed to browse media',
        );
        setItems([]);
      })
      .finally(() => {
        if (fetchIdRef.current !== id) return;
        setLoading(false);
      });
  }, [entityId, history, sendMessage]);

  const browse = useCallback(
    (node: MediaBrowserNode) => {
      if (!node.canExpand) return;
      setHistory(prev => [...prev, node]);
    },
    [],
  );

  const goBack = useCallback(() => {
    setHistory(prev => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }, []);

  const goToRoot = useCallback(() => {
    setHistory([]);
  }, []);

  const goToIndex = useCallback((index: number) => {
    setHistory(prev => prev.slice(0, index + 1));
  }, []);

  const playItem = useCallback(
    (node: MediaBrowserNode, enqueue?: HaEnqueueMode) => {
      callService('media_player', 'play_media', {
        entity_id: entityId,
        media_content_type: node.mediaContentType,
        media_content_id: node.mediaContentId,
        ...(enqueue ? { enqueue } : {}),
      });
    },
    [entityId, callService],
  );

  return useMemo(
    () => ({ items, history, loading, error, browse, goBack, goToRoot, goToIndex, playItem }),
    [items, history, loading, error, browse, goBack, goToRoot, goToIndex, playItem],
  );
}
