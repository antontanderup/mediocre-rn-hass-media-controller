import type { IconName } from '@/components/Icon';

export function iconForMediaClass(mediaClass: string | undefined): IconName {
  switch (mediaClass) {
    case 'track':
    case 'music':
      return 'music-note';
    case 'album':
      return 'album';
    case 'artist':
      return 'account';
    case 'playlist':
      return 'playlist-play';
    case 'genre':
      return 'music-box-multiple';
    case 'podcast':
      return 'microphone';
    case 'app':
      return 'apps';
    case 'directory':
      return 'folder';
    case 'radio':
      return 'radio';
    case 'audiobook':
      return 'book-open-variant';
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
