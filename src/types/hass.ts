/**
 * Core Home Assistant domain types.
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

// ─── WebSocket Connection ─────────────────────────────────────────────────────

export interface HassWsConnection {
  /**
   * Subscribe to entity state updates. The callback receives a snapshot of
   * ALL known entities on each change. Returns an unsubscribe function.
   */
  subscribeEntities: (callback: (entities: Record<string, HassEntity>) => void) => () => void;
  /** Fire-and-forget HA service call. */
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id?: string | string[] },
  ) => void;
  /** Close the underlying WebSocket. */
  close: () => void;
}
