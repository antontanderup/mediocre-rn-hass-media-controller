import type { HaFilterConfig, MaFilterConfig } from '@/types';

export const HA_FILTER_DEFAULTS: HaFilterConfig[] = [
  { type: 'all', name: 'All', icon: 'infinity-line' },
  { type: 'artists', name: 'Artists', icon: 'user-3-line' },
  { type: 'albums', name: 'Albums', icon: 'album-line' },
  { type: 'tracks', name: 'Tracks', icon: 'music-2-line' },
  { type: 'playlists', name: 'Playlists', icon: 'play-list-2-line' },
];

export const MA_FILTER_DEFAULTS: MaFilterConfig[] = [
  { type: 'all', name: 'All' },
  { type: 'artist', name: 'Artists' },
  { type: 'album', name: 'Albums' },
  { type: 'track', name: 'Tracks' },
  { type: 'playlist', name: 'Playlists' },
  { type: 'radio', name: 'Radio' },
  { type: 'audiobook', name: 'Audiobooks' },
  { type: 'podcast', name: 'Podcasts' },
];
