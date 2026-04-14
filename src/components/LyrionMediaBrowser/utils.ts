import type { LyrionBrowserItem, LyrionNavigationItem } from './types';

export type BrowseContext = {
  depth: number;
  current: LyrionNavigationItem;
  appCommand?: string;
  appSearchItemId?: string;
  genreId?: string;
  artistId?: string;
  albumId?: string;
  playlistId?: string;
};

export function buildBrowseParams(
  context: BrowseContext,
  startIndex: number = 0,
  searchTerm: string = '',
): {
  command: string;
  parameters: string[];
} {
  const { depth, current, appCommand, appSearchItemId, genreId, artistId, albumId, playlistId } =
    context;

  const params = [startIndex.toString(), '100'];

  if (depth === 1) {
    const command = current.command;

    if (current.type === 'app') {
      return { command, parameters: ['items', startIndex.toString(), '100'] };
    }

    if (command === 'favorites') {
      return { command: 'favorites', parameters: ['items', startIndex.toString(), '100', 'want_url:1'] };
    }

    if (current.parameters.length > 0) {
      params.push(...current.parameters);
    }

    if (searchTerm) {
      params.push(`search:${searchTerm}`);
    }

    if (current.type === 'album' && command === 'titles') {
      params.push(`album_id:${current.id}`);
    } else if (current.type === 'artist' && command === 'albums') {
      params.push(`artist_id:${current.id}`);
    }

    if (command === 'artists') {
      params.push('tags:a');
    } else if (command === 'albums') {
      params.push('tags:alj');
    } else if (command === 'titles') {
      params.push('tags:altj');
    }
    return { command, parameters: params };
  }

  if (appCommand) {
    const appParams = ['items', startIndex.toString(), '100'];
    if (searchTerm && appSearchItemId) {
      appParams.push(`item_id:${appSearchItemId}`);
      appParams.push(`search:${searchTerm}`);
    } else if (current.type !== 'app') {
      appParams.push(`item_id:${current.id}`);
    }
    return { command: appCommand, parameters: appParams };
  }

  let command = current.command;

  if (playlistId && current.command === 'titles') {
    command = 'playlists tracks';
    const plParams = [playlistId, startIndex.toString(), '100'];
    if (searchTerm) plParams.push(`search:${searchTerm}`);
    plParams.push('tags:altj');
    return { command, parameters: plParams };
  }

  if (searchTerm) params.push(`search:${searchTerm}`);

  if (genreId && current.command === 'artists') {
    params.push(`genre_id:${genreId}`);
    params.push('tags:a');
  }

  if (artistId && current.command === 'albums') {
    params.push(`artist_id:${artistId}`);
    params.push('tags:alj');
  }

  if (current.command === 'titles' && !playlistId) {
    if (albumId) params.push(`album_id:${albumId}`);
    params.push('tags:altj');
  }

  return { command, parameters: params };
}

export function buildPlaylistSearchTerm(item: LyrionBrowserItem): string {
  switch (item.type) {
    case 'track':
      return `track.id=${item.id}`;
    case 'album':
      return `album.id=${item.id}`;
    case 'artist':
      return `contributor.id=${item.id}`;
    case 'playlist':
      return `playlist.id=${item.id}`;
    case 'genre':
      return `genre.id=${item.id}`;
    default:
      return `track.id=${item.id}`;
  }
}
