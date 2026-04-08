import { Pressable, View } from 'react-native';
import { SUPPORT_NEXT_TRACK, SUPPORT_PREVIOUS_TRACK, SUPPORT_REPEAT_SET, SUPPORT_SHUFFLE_SET } from '@/types';
import { createUseStyles } from '@/utils';
import { useTheme } from '@/hooks';
import { Icon } from '@/components/Icon';
import type { PlaybackControlsProps } from './PlaybackControls.types';

const useStyles = createUseStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  const hasShuffle = (supported & SUPPORT_SHUFFLE_SET) !== 0;
  const hasRepeat = (supported & SUPPORT_REPEAT_SET) !== 0;
  const isPlaying = player.state === 'playing' || player.state === 'buffering';
  const shuffle = player.attributes.shuffle ?? false;
  const repeat = player.attributes.repeat ?? 'off';

  const handleShufflePress = () => {
    onCommand({ type: 'shuffle', shuffle: !shuffle });
  };

  const handleRepeatPress = () => {
    const next = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
    onCommand({ type: 'repeat', repeat: next });
  };

  return (
    <View style={styles.container}>
      {hasShuffle && (
        <Pressable
          style={styles.secondaryButton}
          onPress={handleShufflePress}
          accessibilityLabel={shuffle ? 'Shuffle on' : 'Shuffle off'}
          accessibilityRole="button"
        >
          <Icon
            name={shuffle ? 'shuffle-variant' : 'shuffle-disabled'}
            size={20}
            color={shuffle ? theme.primary : theme.onSurfaceVariant}
          />
        </Pressable>
      )}

      <Pressable
        style={[styles.button, !hasPrev && styles.buttonDisabled]}
        onPress={() => onCommand({ type: 'previous' })}
        disabled={!hasPrev}
        accessibilityLabel="Previous track"
        accessibilityRole="button"
      >
        <Icon name="skip-previous" size={24} color={theme.primary} />
      </Pressable>

      <Pressable
        style={styles.playPauseButton}
        onPress={() => onCommand({ type: isPlaying ? 'pause' : 'play' })}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        <Icon
          name={isPlaying ? 'pause' : 'play'}
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
        <Icon name="skip-next" size={24} color={theme.primary} />
      </Pressable>

      {hasRepeat && (
        <Pressable
          style={styles.secondaryButton}
          onPress={handleRepeatPress}
          accessibilityLabel={`Repeat ${repeat}`}
          accessibilityRole="button"
        >
          <Icon
            name={repeat === 'one' ? 'repeat-once'  : repeat === 'all' ? "repeat" : 'repeat-off'}
            size={20}
            color={repeat !== 'off' ? theme.primary : theme.onSurfaceVariant}
          />
        </Pressable>
      )}
    </View>
  );
};
