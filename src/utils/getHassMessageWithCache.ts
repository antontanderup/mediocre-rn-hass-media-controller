type SendFn = <T>(message: { type: string } & Record<string, unknown>) => Promise<T>;

type HassCacheEntry<T = unknown> = {
  value: T;
  timestamp: number;
  staleTime: number;
};

let _hassCache: Record<string, HassCacheEntry<unknown>> = {};

export async function getHassMessageWithCache<T>(
  message: { type: string } & Record<string, unknown>,
  sendFn: SendFn,
  options?: { forceRefresh?: boolean; staleTime?: number },
): Promise<T> {
  const key = JSON.stringify(message);
  const staleTime = options?.staleTime ?? 10000;
  const entry = _hassCache[key] as HassCacheEntry<T> | undefined;
  const now = Date.now();

  if (!options?.forceRefresh && entry && now - entry.timestamp < entry.staleTime) {
    return entry.value;
  }

  const response = await sendFn<T>(message);
  _hassCache = {
    ..._hassCache,
    [key]: { value: response, timestamp: now, staleTime },
  };
  return response;
}

export function clearHassMessageCache(key?: string): void {
  if (key) {
    const { [key]: _, ...rest } = _hassCache;
    _hassCache = rest;
  } else {
    _hassCache = {};
  }
}
