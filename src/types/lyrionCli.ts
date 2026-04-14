export type SqueezeboxPlaylistItem = {
  id: string;
  title: string;
  'playlist index': number;
};

export type SqueezeboxStatusResponse = {
  player_ip?: string;
  playlist_cur_index?: number;
  playlist_loop?: SqueezeboxPlaylistItem[];
  [key: string]: unknown;
};

export type SqueezeboxSongInfoLoopItem = {
  id?: string;
  title?: string;
  artist?: string;
  coverid?: string;
  duration?: number;
  coverart?: string;
  album?: string;
  modificationTime?: string;
  type?: string;
  bitrate?: string;
  remote?: number;
  year?: string;
  addedTime?: string;
  artwork_url?: string;
  lastUpdated?: string;
  live_edge?: string;
  artwork_track_id?: string;
};

export type SqueezeboxSonginfoResponse = {
  songinfo_loop?: SqueezeboxSongInfoLoopItem[];
  [key: string]: unknown;
};

export type SqueezeboxServerStatusResponse = {
  ip?: string;
  httpport?: string;
  [key: string]: unknown;
};

type LyrionArtistItem = { id: string; artist: string };
type LyrionAlbumItem = { id: string; album: string; artist?: string; artwork_track_id?: string };
type LyrionTrackItem = { id: string; title: string; artist?: string; artwork_track_id?: string; duration?: number };
type LyrionGenreItem = { id: string; genre: string };
type LyrionPlaylistItem = { id: string; playlist: string };
type LyrionAppItem = { cmd: string; name: string; icon?: string };
type LyrionLoopItem = {
  id: string;
  type?: string;
  line1?: string;
  name?: string;
  title?: string;
  artist?: string;
  line2?: string;
  url?: string;
  isaudio?: number;
  hasitems?: number;
  image?: string;
  icon?: string;
  artwork_url?: string;
};

export type LyrionBrowseResponse = {
  count?: number;
  artists_loop?: LyrionArtistItem[];
  contributors_loop?: LyrionArtistItem[];
  albums_loop?: LyrionAlbumItem[];
  titles_loop?: LyrionTrackItem[];
  tracks_loop?: LyrionTrackItem[];
  playlisttracks_loop?: LyrionTrackItem[];
  genres_loop?: LyrionGenreItem[];
  playlists_loop?: LyrionPlaylistItem[];
  appss_loop?: LyrionAppItem[];
  radioss_loop?: LyrionAppItem[];
  loop_loop?: LyrionLoopItem[];
  [key: string]: unknown;
};
