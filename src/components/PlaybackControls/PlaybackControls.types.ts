import type { MediaPlayerEntity, PlaybackCommand } from '@/types';

export interface PlaybackControlsProps {
  player: MediaPlayerEntity;
  onCommand: (cmd: PlaybackCommand) => void;
}
