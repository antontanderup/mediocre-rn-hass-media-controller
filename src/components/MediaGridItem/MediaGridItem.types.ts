import type { IconName } from '@/components/Icon';

export type MediaGridItemProps = {
  title: string;
  artworkUrl?: string;
  fallbackIcon?: IconName;
  onPress: () => void;
  onLongPress?: () => void;
};
