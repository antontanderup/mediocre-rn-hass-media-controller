/** A search entry — an entity whose media can be searched. */
export type SearchEntry = {
  entity_id: string;
  name?: string | null;
};

/** A media browser entry — an entity whose media library can be browsed. */
export type MediaBrowserEntry = {
  entity_id: string;
  name?: string | null;
};

export type MediaPlayerConfig = {
  entityId: string;
  name?: string | null;
  speakerGroupEntityId?: string | null;
  canBeGrouped?: boolean | null;
  maEntityId?: string | null;
  maFavoriteButtonEntityId?: string | null;
  lmsEntityId?: string | null;
  /** HA search entries. When empty/omitted the player's own entityId is used. MA is added automatically when maEntityId is set. */
  searchEntries?: SearchEntry[];
  /** Media browser entries. When empty/omitted the player's own entityId is used. */
  mediaBrowserEntries?: MediaBrowserEntry[];
};

export type AppOptions = {
  useArtColors?: boolean;
  playerIsActiveWhen?: 'playing' | 'playing_or_paused';
};

export type AppConfig = {
  mediaPlayers: MediaPlayerConfig[];
  options: AppOptions;
};
