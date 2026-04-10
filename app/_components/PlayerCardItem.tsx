import { MediaCard } from '@/components';
import { useMediaPlayerControls } from '@/hooks';
import type { MediaPlayerEntity } from '@/types';

export interface PlayerCardItemProps {
  player: MediaPlayerEntity;
  onPress: () => void;
  nameOverride?: string;
  isActive?: boolean;
}

export const PlayerCardItem = ({ player, onPress, nameOverride, isActive }: PlayerCardItemProps): React.JSX.Element => {
  const controls = useMediaPlayerControls(player.entity_id);
  const isPlaying = player.state === 'playing' || player.state === 'buffering';

  return (
    <MediaCard
      player={player}
      onPress={onPress}
      onPlayPause={() => (isPlaying ? controls.pause() : controls.play())}
      nameOverride={nameOverride}
      isActive={isActive}
    />
  );
};
