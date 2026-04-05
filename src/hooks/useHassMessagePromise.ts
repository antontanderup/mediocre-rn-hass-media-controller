import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getHassMessageWithCache } from '@/utils';
import { useHassContext } from '@/context';

/**
 * React hook for sending Home Assistant WebSocket messages with caching and
 * loading / error / refetch state. Ported from mediocre-hass-media-player-cards.
 */
export function useHassMessagePromise<T>(
  message: ({ type: string } & Record<string, unknown>) | null,
  options?: { forceRefresh?: boolean; staleTime?: number; enabled?: boolean },
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const { sendMessage } = useHassContext();

  const [keyedData, setKeyedData] = useState<{ key: string; value: T | null }>({
    key: '',
    value: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messageKey = useMemo(() => (message ? JSON.stringify(message) : ''), [message]);

  const data = keyedData.key === messageKey ? keyedData.value : null;
  const isPending =
    !!message && options?.enabled !== false && keyedData.key !== messageKey;

  const latestMessageKeyRef = useRef<string>('');

  const fetch = useCallback(
    async (overrideOptions?: { forceRefresh?: boolean; staleTime?: number; enabled?: boolean }) => {
      if (!message || options?.enabled === false || overrideOptions?.enabled === false) return;
      const key = JSON.stringify(message);
      latestMessageKeyRef.current = key;
      setLoading(true);
      setError(null);
      try {
        const result = await getHassMessageWithCache<{ response?: T }>(
          message,
          sendMessage,
          { ...options, ...overrideOptions },
        );
        if (latestMessageKeyRef.current === key) {
          setKeyedData({ key, value: result?.response ?? null });
          setLoading(false);
        }
      } catch (e: unknown) {
        if (latestMessageKeyRef.current === key) {
          setError(
            e && typeof e === 'object' && 'message' in e
              ? (e as Error).message
              : 'Unknown error',
          );
          setLoading(false);
          setKeyedData({ key, value: null });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messageKey, sendMessage, options?.staleTime, options?.enabled],
  );

  const refetch = useCallback(() => fetch({ forceRefresh: true }), [fetch]);

  useEffect(() => {
    if (message && options?.enabled !== false) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageKey, options?.staleTime, options?.enabled]);

  return useMemo(
    () => ({ data, loading: loading || isPending, error, refetch }),
    [data, loading, isPending, error, refetch],
  );
}
