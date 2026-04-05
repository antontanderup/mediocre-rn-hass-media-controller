/**
 * Native WebSocket implementation of the Home Assistant WebSocket API.
 * Replaces home-assistant-js-websocket for Hermes/React Native compatibility.
 *
 * Protocol reference:
 * https://developers.home-assistant.io/docs/api/websocket
 */

import type { HassConfig, HassEntity, HassWsConnection } from '@/types';

// Error codes (mirrors the constants from home-assistant-js-websocket)
export const ERR_CANNOT_CONNECT = 1;
export const ERR_CONNECTION_LOST = 2;
export const ERR_INVALID_AUTH = 11;
export const ERR_INVALID_HTTPS_TO_HTTP = 12;

// ─── Internal message shapes ─────────────────────────────────────────────────

type AuthRequiredMsg = { type: 'auth_required'; ha_version: string };
type AuthOkMsg = { type: 'auth_ok'; ha_version: string };
type AuthInvalidMsg = { type: 'auth_invalid'; message: string };
type ResultMsg = { id: number; type: 'result'; success: boolean; result: unknown };
type StateChangedEventMsg = {
  id: number;
  type: 'event';
  event: {
    event_type: 'state_changed';
    data: {
      entity_id: string;
      old_state: HassEntity | null;
      new_state: HassEntity | null;
    };
  };
};

type InboundMsg = AuthRequiredMsg | AuthOkMsg | AuthInvalidMsg | ResultMsg | StateChangedEventMsg;

type EntityCallback = (entities: Record<string, HassEntity>) => void;

// ─── URL builder ─────────────────────────────────────────────────────────────

const buildWsUrl = ({ host, port, ssl }: HassConfig): string => {
  const scheme = ssl ? 'wss' : 'ws';
  const cleanHost = host.replace(/^(?:https?|wss?):\/\//i, '').replace(/\/+$/, '');
  return `${scheme}://${cleanHost}:${port}/api/websocket`;
};

// ─── connectToHass ────────────────────────────────────────────────────────────

/**
 * Opens a WebSocket connection to Home Assistant, authenticates, and returns
 * a HassWsConnection handle. The returned function closes the connection.
 *
 * Callbacks are never invoked after close() is called.
 */
export const connectToHass = (
  config: HassConfig,
  onReady: (connection: HassWsConnection) => void,
  onAuthInvalid: () => void,
  onConnectionError: (code: number) => void,
): (() => void) => {
  let closed = false;
  let authenticated = false;
  let cmdId = 1;
  let getStatesId = -1;
  const entities: Record<string, HassEntity> = {};
  let subscribers: EntityCallback[] = [];

  const url = buildWsUrl(config);
  const ws = new WebSocket(url);

  const close = (): void => {
    if (closed) return;
    closed = true;
    ws.close();
  };

  const send = (msg: Record<string, unknown>): void => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const nextId = (): number => cmdId++;

  const notifySubscribers = (): void => {
    const snapshot = { ...entities };
    for (const cb of subscribers) {
      cb(snapshot);
    }
  };

  const connection: HassWsConnection = {
    subscribeEntities: (callback: EntityCallback): (() => void) => {
      subscribers.push(callback);
      // deliver current state immediately if already populated
      if (Object.keys(entities).length > 0) {
        callback({ ...entities });
      }
      return () => {
        subscribers = subscribers.filter(cb => cb !== callback);
      };
    },
    callService: (
      domain: string,
      service: string,
      serviceData?: Record<string, unknown>,
      target?: { entity_id?: string | string[] },
    ): void => {
      send({
        id: nextId(),
        type: 'call_service',
        domain,
        service,
        service_data: serviceData,
        target,
      });
    },
    close,
  };

  ws.onopen = (): void => {
    // wait for auth_required from the server
  };

  ws.onmessage = (event: MessageEvent): void => {
    if (closed) return;

    let msg: InboundMsg;
    try {
      msg = JSON.parse(event.data as string) as InboundMsg;
    } catch {
      return;
    }

    switch (msg.type) {
      case 'auth_required':
        send({ type: 'auth', access_token: config.token });
        break;

      case 'auth_ok': {
        authenticated = true;
        // Fetch all current entity states
        getStatesId = nextId();
        send({ id: getStatesId, type: 'get_states' });
        // Subscribe to all future state changes
        send({ id: nextId(), type: 'subscribe_events', event_type: 'state_changed' });
        onReady(connection);
        break;
      }

      case 'auth_invalid':
        closed = true;
        ws.close();
        onAuthInvalid();
        break;

      case 'result':
        if (msg.id === getStatesId && msg.success && Array.isArray(msg.result)) {
          for (const entity of msg.result as HassEntity[]) {
            entities[entity.entity_id] = entity;
          }
          notifySubscribers();
        }
        break;

      case 'event': {
        const { entity_id, new_state } = msg.event.data;
        if (new_state === null) {
          delete entities[entity_id];
        } else {
          entities[entity_id] = new_state;
        }
        notifySubscribers();
        break;
      }
    }
  };

  ws.onerror = (): void => {
    if (closed) return;
    // onerror is always followed by onclose, so we let onclose handle the callback
    // to avoid double-firing. Mark closed here to ensure onclose knows the cause.
    if (!authenticated) {
      closed = true;
      onConnectionError(ERR_CANNOT_CONNECT);
    }
  };

  ws.onclose = (): void => {
    if (closed) return;
    closed = true;
    onConnectionError(authenticated ? ERR_CONNECTION_LOST : ERR_CANNOT_CONNECT);
  };

  return close;
};
