import type { HassConfig } from '@/types';

/**
 * Builds the WebSocket URL for a given Home Assistant config.
 * Strips any protocol prefix (http://, https://, ws://, wss://) and trailing
 * slashes the user may have accidentally included in the host field.
 */
export const buildWsUrl = ({ host, port, ssl }: HassConfig): string => {
  const scheme = ssl ? 'wss' : 'ws';
  const cleanHost = host
    .replace(/^(?:https?|wss?):\/\//i, '')
    .replace(/\/+$/, '');
  return `${scheme}://${cleanHost}:${port}/api/websocket`;
};
