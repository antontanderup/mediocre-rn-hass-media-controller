import type { IconName } from '@/components/Icon';

export function iconForMediaClass(mediaClass: string | undefined): IconName {
  switch (mediaClass) {
    case 'track':
    case 'music':
      return 'music-note';
    case 'album':
      return 'album';
    case 'artist':
      return 'person';
    case 'playlist':
      return 'playlist-play';
    case 'genre':
      return 'library-music';
    case 'podcast':
      return 'mic';
    case 'app':
      return 'apps';
    case 'directory':
      return 'folder';
    case 'radio':
      return 'radio';
    case 'audiobook':
      return 'menu-book';
    default:
      return 'folder';
  }
}

export function resolveArtworkUrl(
  thumbnail: string | undefined,
  hassBaseUrl: string,
): string | undefined {
  if (!thumbnail) return undefined;
  if (/^https?:\/\//i.test(thumbnail)) return thumbnail;
  return `${hassBaseUrl}${thumbnail}`;
}
