import type { MediaPlayerEntity } from '@/types';

export interface MediaCardProps {
  player: MediaPlayerEntity;
  onPress: () => void;
  onPlayPause: () => void;
  nameOverride?: string;
  isActive?: boolean;
}
