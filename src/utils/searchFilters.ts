import type { HaFilterConfig, MaFilterConfig } from '@/types';

export const HA_FILTER_DEFAULTS: HaFilterConfig[] = [
  { type: 'all', name: 'All', icon: 'all-inclusive' },
  { type: 'artists', name: 'Artists', icon: 'account' },
  { type: 'albums', name: 'Albums', icon: 'album' },
  { type: 'tracks', name: 'Tracks', icon: 'music-note' },
  { type: 'playlists', name: 'Playlists', icon: 'playlist-play' },
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
