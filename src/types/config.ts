/**
 * Configures a single HA search provider for a media player.
 * When omitted the player's own entityId is used as the sole provider.
 */
export type SearchProviderConfig = {
  entity_id: string;
  name?: string;
};

export type MediaPlayerConfig = {
  entityId: string;
  name?: string | null;
  speakerGroupEntityId?: string | null;
  canBeGrouped?: boolean | null;
  maEntityId?: string | null;
  maFavoriteButtonEntityId?: string | null;
  lmsEntityId?: string | null;
  /** Additional HA search providers (e.g. a separate search entity). MA is added automatically when maEntityId is set. */
  search?: SearchProviderConfig[];
};

export type AppOptions = {
  useArtColors?: boolean;
  disablePlayerFocusSwitching?: boolean;
  playerIsActiveWhen?: 'playing' | 'playing_or_paused';
  showVolumeStepButtons?: boolean;
};

export type AppConfig = {
  mediaPlayers: MediaPlayerConfig[];
  options: AppOptions;
};
