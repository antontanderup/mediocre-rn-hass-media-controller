/**
 * Core Home Assistant domain types.
 * WebSocket plumbing is handled by home-assistant-js-websocket.
 */

export type HassAuthState = 'connecting' | 'authenticating' | 'authenticated' | 'error' | 'auth_invalid';

export interface HassConfig {
  host: string;
  /** Long-lived access token */
  token: string;
  /** Whether to use https:// instead of http:// */
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

// ─── Playback Commands ────────────────────────────────────────────────────────

export type PlaybackCommand =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'next' }
  | { type: 'previous' };

// Bitmask values from HA supported_features
export const SUPPORT_PREVIOUS_TRACK = 16;
export const SUPPORT_NEXT_TRACK = 32;
