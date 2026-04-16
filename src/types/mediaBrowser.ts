// ─── Shared browse types ──────────────────────────────────────────────────────

import { IconName } from "@/components";

/** Raw item shape returned by media_player.browse_media and search_media */
export type HaMediaItem = {
  media_class: string;
  media_content_id: string;
  media_content_type: string;
  title: string;
  can_play: boolean;
  can_expand: boolean;
  can_search?: boolean;
  thumbnail?: string;
};

/** CamelCase shape used by useMediaBrowser and MediaBrowserItem */
export type MediaBrowserNode = {
  title: string;
  mediaContentId: string;
  mediaContentType: string;
  mediaClass: string;
  canPlay: boolean;
  canExpand: boolean;
  thumbnail?: string;
  childrenMediaClass?: string;
};

// ─── HA Search ───────────────────────────────────────────────────────────────

export type HaFilterType = 'all' | 'tracks' | 'albums' | 'artists' | 'playlists' | (string & {});

export type HaEnqueueMode = 'play' | 'replace' | 'next' | 'add';

export type HaFilterConfig = {
  type: HaFilterType;
  name: string;
  icon?: IconName;
};

// ─── MA Search ───────────────────────────────────────────────────────────────

export type MaMediaType =
  | 'artist'
  | 'album'
  | 'track'
  | 'playlist'
  | 'radio'
  | 'audiobook'
  | 'podcast';

export type MaFilterType = MaMediaType | 'all';

export type MaEnqueueMode = 'play' | 'replace' | 'next' | 'replace_next' | 'add';

export type MaFilterConfig = {
  type: MaFilterType;
  name: string;
};

/** Minimal artist reference nested within tracks and albums */
export type MaArtistRef = {
  name: string;
  image?: string | null;
};

/** Base fields shared by all MA media items */
type MaMediaItemBase = {
  uri: string;
  name: string;
  version?: string;
  image?: string | null;
};

export type MaArtistItem = MaMediaItemBase & { media_type: 'artist' };

export type MaAlbumItem = MaMediaItemBase & {
  media_type: 'album';
  artists?: MaArtistRef[];
};

export type MaTrackItem = MaMediaItemBase & {
  media_type: 'track';
  artists?: MaArtistRef[];
  album?: MaAlbumItem;
};

export type MaOtherItem = MaMediaItemBase & {
  media_type: Exclude<MaMediaType, 'artist' | 'album' | 'track'>;
};

/** Union of all Music Assistant media item shapes returned by the search/library API */
export type MaMediaItem = MaArtistItem | MaAlbumItem | MaTrackItem | MaOtherItem;

/**
 * MA search results organised by type.
 * Keys are plural (artists, albums, tracks, …) matching the MA API response.
 */
export type MaSearchResults = {
  artists?: MaMediaItem[];
  albums?: MaMediaItem[];
  tracks?: MaMediaItem[];
  playlists?: MaMediaItem[];
  radio?: MaMediaItem[];
  audiobooks?: MaMediaItem[];
  podcasts?: MaMediaItem[];
};

/** Human-readable label for each MA response key */
export const MA_SECTION_LABELS: Record<string, string> = {
  artists: 'Artists',
  albums: 'Albums',
  tracks: 'Tracks',
  playlists: 'Playlists',
  radio: 'Radio',
  audiobooks: 'Audiobooks',
  podcasts: 'Podcasts',
};

/** Ordered list of MA result section keys for consistent rendering */
export const MA_SECTION_ORDER: (keyof MaSearchResults)[] = [
  'tracks',
  'albums',
  'artists',
  'playlists',
  'radio',
  'audiobooks',
  'podcasts',
];
