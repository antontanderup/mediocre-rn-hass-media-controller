import type { HassConfig } from '@/types';

/**
 * Builds the WebSocket URL for a given Home Assistant config.
 */
export const buildWsUrl = ({ host, port, ssl }: HassConfig): string => {
  const scheme = ssl ? 'wss' : 'ws';
  return `${scheme}://${host}:${port}/api/websocket`;
};
