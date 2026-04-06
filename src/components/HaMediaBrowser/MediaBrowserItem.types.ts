import type { MediaBrowserNode, HaEnqueueMode } from '@/types';

export interface MediaBrowserItemProps {
  node: MediaBrowserNode;
  variant: 'grid' | 'track';
  hassBaseUrl: string;
  onPress: (node: MediaBrowserNode) => void;
  onPlay: (node: MediaBrowserNode, enqueue?: HaEnqueueMode) => void;
}
