export type MediaPlayerConfig = {
  entityId: string;
  name?: string | null;
  speakerGroupEntityId?: string | null;
  canBeGrouped?: boolean | null;
  maEntityId?: string | null;
  maFavoriteButtonEntityId?: string | null;
  lmsEntityId?: string | null;
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
