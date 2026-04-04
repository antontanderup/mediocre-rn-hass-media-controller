import { Pressable, View } from 'react-native';
import { SUPPORT_NEXT_TRACK, SUPPORT_PREVIOUS_TRACK } from '@/types';
import { createUseStyles } from '@/utils';
import { useTheme } from '@/hooks';
import { Icon } from '@/components/Icon';
import type { PlaybackControlsProps } from './PlaybackControls.types';

const useStyles = createUseStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },
}));

export const PlaybackControls = ({ player, onCommand }: PlaybackControlsProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const supported = player.attributes.supported_features ?? 0;
  const hasPrev = (supported & SUPPORT_PREVIOUS_TRACK) !== 0;
  const hasNext = (supported & SUPPORT_NEXT_TRACK) !== 0;
  const isPlaying = player.state === 'playing' || player.state === 'buffering';

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, !hasPrev && styles.buttonDisabled]}
        onPress={() => onCommand({ type: 'previous' })}
        disabled={!hasPrev}
        accessibilityLabel="Previous track"
        accessibilityRole="button"
      >
        <Icon name="skip-back-line" size={24} color={theme.primary} />
      </Pressable>

      <Pressable
        style={styles.playPauseButton}
        onPress={() => onCommand({ type: isPlaying ? 'pause' : 'play' })}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        <Icon
          name={isPlaying ? 'pause-line' : 'play-line'}
          size={28}
          color={theme.onPrimary}
        />
      </Pressable>

      <Pressable
        style={[styles.button, !hasNext && styles.buttonDisabled]}
        onPress={() => onCommand({ type: 'next' })}
        disabled={!hasNext}
        accessibilityLabel="Next track"
        accessibilityRole="button"
      >
        <Icon name="skip-forward-line" size={24} color={theme.primary} />
      </Pressable>
    </View>
  );
};
