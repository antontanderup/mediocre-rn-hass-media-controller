import type { HassConfig } from '@/types';

/**
 * Builds the base HTTP(S) URL for a given Home Assistant config.
 * This is what home-assistant-js-websocket expects — it derives the WebSocket
 * URL (/api/websocket) internally.
 *
 * Strips any protocol prefix (http://, https://, ws://, wss://) and trailing
 * slashes the user may have accidentally included in the host field.
 */
export const buildHassUrl = ({ host, port, ssl }: HassConfig): string => {
  const scheme = ssl ? 'https' : 'http';
  const cleanHost = host
    .replace(/^(?:https?|wss?):\/\//i, '')
    .replace(/\/+$/, '');
  return `${scheme}://${cleanHost}:${port}`;
};
