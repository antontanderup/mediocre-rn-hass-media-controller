import type { HassConfig, PingResult } from '@/types';
import { buildHassUrl } from './buildHassUrl';

const PING_TIMEOUT_MS = 5000;

/**
 * Sends a single HTTP GET to the HA REST API health endpoint
 * (`/api/`) and returns a PingResult.
 *
 * Any HTTP response (including 401 Unauthorized) counts as "reachable" —
 * it means the server is up and accepting TCP connections.  A network error
 * (DNS failure, refused connection, timeout) means it is not.
 */
export const pingHass = async (config: HassConfig): Promise<PingResult> => {
  const url = `${buildHassUrl(config)}/api/`;
  const start = Date.now();

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    return {
      reachable: true,
      statusCode: response.status,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    return {
      reachable: false,
      latencyMs: Date.now() - start,
      error: isTimeout ? 'Request timed out' : (err instanceof Error ? err.message : 'Unknown error'),
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
};
