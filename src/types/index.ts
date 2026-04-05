export type { AppTheme } from './theme';

export type { QueueItem } from './queue';

export type {
  SqueezeboxPlaylistItem,
  SqueezeboxStatusResponse,
  SqueezeboxSongInfoLoopItem,
  SqueezeboxSonginfoResponse,
  SqueezeboxServerStatusResponse,
} from './lyrionCli';

export type { AppConfig, MediaPlayerConfig, AppOptions } from './config';

export type {
  HassAuthState,
  HassConfig,
  HassEntity,
  MediaPlayerState,
  MediaType,
  MediaPlayerAttributes,
  MediaPlayerEntity,
  PlaybackCommand,
  PingResult,
} from './hass';

export { SUPPORT_PREVIOUS_TRACK, SUPPORT_NEXT_TRACK } from './hass';
