import type { IconName } from '@/components/Icon';

export type MediaTrackItemProps = {
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  fallbackIcon?: IconName;
  onPress?: () => void;
  /** When provided, a play button is shown. */
  onPlay?: () => void;
  /** When true, a chevron is shown instead of/after the play button. */
  showChevron?: boolean;
};
