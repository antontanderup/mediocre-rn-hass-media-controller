import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getHassMessageWithCache } from '@/utils';
import { useHassContext } from '@/context';

/**
 * React hook for sending Home Assistant WebSocket messages with caching and
 * loading / error / refetch state.
 *
 * Design notes:
 * - `fetch` is intentionally stable (empty dep array) and reads its inputs
 *   through refs, so callers always hold a non-stale refetch handle.
 * - An incrementing sequence counter is used to discard responses from
 *   superseded in-flight calls (avoids the same-key race condition that a
 *   key-based approach cannot prevent).
 */
export function useHassMessagePromise<T>(
  message: ({ type: string } & Record<string, unknown>) | null,
  options?: { staleTime?: number; enabled?: boolean },
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const { sendMessage } = useHassContext();

  // Always-current refs so the stable `fetch` closure never goes stale
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const messageRef = useRef(message);
  messageRef.current = message;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const messageKey = useMemo(() => (message ? JSON.stringify(message) : ''), [message]);

  const [keyedData, setKeyedData] = useState<{ key: string; value: T | null }>({
    key: '',
    value: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monotonically increasing counter; only the call whose seq equals the
  // current value at completion is allowed to commit state.
  const seqRef = useRef(0);

  const fetch = useCallback(async (forceRefresh?: boolean) => {
    const msg = messageRef.current;
    const opts = optionsRef.current;
    const send = sendMessageRef.current;

    if (!msg || opts?.enabled === false) return;

    const key = JSON.stringify(msg);
    const seq = ++seqRef.current;

    setLoading(true);
    setError(null);
    try {
      const result = await getHassMessageWithCache<{ response?: T }>(
        msg,
        send,
        { staleTime: opts?.staleTime, forceRefresh },
      );
      if (seq === seqRef.current) {
        setKeyedData({ key, value: result?.response ?? null });
        setLoading(false);
      }
    } catch (e: unknown) {
      if (seq === seqRef.current) {
        setError(
          e && typeof e === 'object' && 'message' in e
            ? (e as Error).message
            : 'Unknown error',
        );
        setLoading(false);
        setKeyedData({ key, value: null });
      }
    }
  }, []); // stable — reads all inputs through refs

  const refetch = useCallback(() => fetch(true), [fetch]);

  const enabled = options?.enabled;
  const staleTime = options?.staleTime;

  useEffect(() => {
    if (message && enabled !== false) {
      fetch();
    }
    // `message` is intentionally excluded: we key on `messageKey` (serialized)
    // so the effect doesn't re-fire when the object reference changes but the
    // content is the same.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageKey, staleTime, enabled, fetch]);

  const data = keyedData.key === messageKey ? keyedData.value : null;
  const isPending = !!message && enabled !== false && keyedData.key !== messageKey;

  return useMemo(
    () => ({ data, loading: loading || isPending, error, refetch }),
    [data, loading, isPending, error, refetch],
  );
}
