import type React from 'react';
import type { IconName } from '@/components/Icon';

export type MediaItemSheetAction = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

export type MediaItemSheetProps = {
  artworkUrl?: string;
  title: string;
  artist?: string;
  actions: MediaItemSheetAction[];
  renderTrigger: (onOpen: () => void) => React.ReactNode;
};
