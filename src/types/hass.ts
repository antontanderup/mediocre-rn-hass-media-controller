/**
 * Core Home Assistant WebSocket API types.
 * Reference: https://developers.home-assistant.io/docs/api/websocket
 */

export type HassAuthState = 'connecting' | 'authenticating' | 'authenticated' | 'error';

export interface HassConfig {
  host: string;
  /** Long-lived access token */
  token: string;
  /** Whether to use wss:// instead of ws:// */
  ssl: boolean;
  port: number;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

// ─── Media Player ────────────────────────────────────────────────────────────

export type MediaPlayerState =
  | 'playing'
  | 'paused'
  | 'idle'
  | 'off'
  | 'unavailable'
  | 'unknown'
  | 'standby'
  | 'buffering';

export type MediaType = 'music' | 'tvshow' | 'movie' | 'video' | 'episode' | 'channel' | 'playlist';

export interface MediaPlayerAttributes {
  [key: string]: unknown;
  friendly_name?: string;
  entity_picture?: string;
  media_title?: string;
  media_artist?: string;
  media_album_name?: string;
  media_album_art?: string;
  media_duration?: number;
  media_position?: number;
  media_position_updated_at?: string;
  media_content_type?: MediaType;
  volume_level?: number;
  is_volume_muted?: boolean;
  shuffle?: boolean;
  repeat?: 'off' | 'one' | 'all';
  source?: string;
  source_list?: string[];
  sound_mode?: string;
  sound_mode_list?: string[];
  group_members?: string[];
  supported_features?: number;
}

export interface MediaPlayerEntity extends HassEntity {
  state: MediaPlayerState;
  attributes: MediaPlayerAttributes;
}

// ─── WebSocket Messages ───────────────────────────────────────────────────────

export interface HassAuthMessage {
  type: 'auth';
  access_token: string;
}

export interface HassSubscribeMessage {
  id: number;
  type: 'subscribe_events';
  event_type: string;
}

export interface HassCallServiceMessage {
  id: number;
  type: 'call_service';
  domain: string;
  service: string;
  service_data?: Record<string, unknown>;
  target?: {
    entity_id?: string | string[];
  };
}

export interface HassGetStatesMessage {
  id: number;
  type: 'get_states';
}

export type HassOutboundMessage =
  | HassAuthMessage
  | HassSubscribeMessage
  | HassCallServiceMessage
  | HassGetStatesMessage;

export interface HassResultMessage<T = unknown> {
  id: number;
  type: 'result';
  success: boolean;
  result: T;
}

export interface HassEventMessage {
  id: number;
  type: 'event';
  event: {
    event_type: string;
    data: {
      entity_id: string;
      old_state: HassEntity | null;
      new_state: HassEntity | null;
    };
    origin: string;
    time_fired: string;
  };
}

export interface HassAuthRequiredMessage {
  type: 'auth_required';
  ha_version: string;
}

export interface HassAuthOkMessage {
  type: 'auth_ok';
  ha_version: string;
}

export interface HassAuthInvalidMessage {
  type: 'auth_invalid';
  message: string;
}

export type HassInboundMessage =
  | HassResultMessage
  | HassEventMessage
  | HassAuthRequiredMessage
  | HassAuthOkMessage
  | HassAuthInvalidMessage;
