import { useEffect, useRef, useState } from 'react';
import type { HassConfig, PingResult } from '@/types';
import { pingHass } from '@/utils';

const PING_INTERVAL_MS = 5000;

/**
 * Polls the HA HTTP health endpoint on a regular interval while `enabled`
 * is true.  Useful for diagnosing connection errors: if the WebSocket
 * can't connect, this tells you whether the server is reachable at all.
 *
 * Returns null until the first ping completes, then the latest PingResult.
 * Resets to null whenever enabled flips to false.
 */
export const usePingHass = (config: HassConfig | null, enabled: boolean): PingResult | null => {
  const [result, setResult] = useState<PingResult | null>(null);
  // Stable ref so the interval callback always sees the latest config
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!enabled || !config) {
      setResult(null);
      return;
    }

    let cancelled = false;

    const runPing = (): void => {
      const current = configRef.current;
      if (!current || cancelled) return;
      pingHass(current)
        .then(r => {
          if (!cancelled) setResult(r);
        })
        .catch(() => {
          // pingHass never rejects, but guard just in case
        });
    };

    runPing();
    const intervalId = setInterval(runPing, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      setResult(null);
    };
  }, [config, enabled]);

  return result;
};
