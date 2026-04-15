import type { IconName } from '@/components/Icon';

export type MediaGridItemProps = {
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  fallbackIcon?: IconName;
  onPress: () => void;
  onLongPress?: () => void;
};
