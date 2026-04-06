import type { IconName } from '@/components/Icon';

export function iconForMediaClass(mediaClass: string | undefined): IconName {
  switch (mediaClass) {
    case 'track':
    case 'music':
      return 'music-2-line';
    case 'album':
      return 'album-line';
    case 'artist':
      return 'user-3-line';
    case 'playlist':
      return 'play-list-2-line';
    case 'genre':
      return 'folder-music-line';
    case 'podcast':
      return 'mic-line';
    case 'app':
      return 'apps-line';
    case 'directory':
      return 'folder-line';
    case 'radio':
      return 'radio-line';
    case 'audiobook':
      return 'book-open-line';
    default:
      return 'folder-line';
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
