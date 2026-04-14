import type { LyrionNavigationItem, LyrionCategoryType } from './types';

export type BrowserHistoryEntry = LyrionNavigationItem & { filter: string };

export const HOME_ENTRY: BrowserHistoryEntry = {
  id: 'home',
  title: 'Home',
  command: '',
  parameters: [],
  type: 'category',
  filter: '',
};

export const CATEGORIES: { id: LyrionCategoryType; title: string; icon: string }[] = [
  { id: 'artists', title: 'Artists', icon: 'account-music' },
  { id: 'albumartists', title: 'Album Artists', icon: 'account-music-outline' },
  { id: 'newartists', title: 'New Artists', icon: 'account-music-outline' },
  { id: 'albums', title: 'Albums', icon: 'album' },
  { id: 'randomalbums', title: 'Random Albums', icon: 'shuffle-variant' },
  { id: 'newmusic', title: 'New Music', icon: 'new-box' },
  { id: 'genres', title: 'Genres', icon: 'music-box-multiple' },
  { id: 'playlists', title: 'Playlists', icon: 'playlist-music' },
  { id: 'tracks', title: 'Tracks', icon: 'music-note' },
  { id: 'favorites', title: 'Favorites', icon: 'star' },
  { id: 'radios', title: 'Radio', icon: 'radio' },
  { id: 'apps', title: 'Apps', icon: 'apps' },
];

export const CATEGORY_COMMANDS: Partial<
  Record<LyrionCategoryType, { command: string; parameters: string[] }>
> = {
  tracks: { command: 'titles', parameters: [] },
  albumartists: { command: 'artists', parameters: ['role_id:ALBUMARTIST'] },
  newartists: { command: 'artists', parameters: ['sort:new'] },
  newmusic: { command: 'albums', parameters: ['sort:new'] },
  randomalbums: { command: 'albums', parameters: ['sort:random'] },
};

export const HOME_NEW_MUSIC_PARAMS = ['0', '100', 'sort:new', 'tags:alj'];
export const HOME_FAVORITES_PARAMS = ['items', '0', '100', 'want_url:1'];
export const HOME_APPS_PARAMS = ['0', '100'];
