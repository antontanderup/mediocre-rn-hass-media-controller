import Slider from '@react-native-community/slider';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { VolumeSliderProps } from './VolumeSlider.types';

const DEBOUNCE_MS = 200;

const useStyles = createUseStyles(() => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
}));

export const VolumeSlider = ({ volume, onVolumeChange }: VolumeSliderProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleValueChange = useCallback(
    (v: number) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        onVolumeChange(v);
        timerRef.current = null;
      }, DEBOUNCE_MS);
    },
    [onVolumeChange],
  );

  return (
    <View style={styles.container}>
      <Icon name="volume-low" size={20} color={theme.onSurfaceVariant} />
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        step={0.02}
        value={volume}
        onValueChange={handleValueChange}
        minimumTrackTintColor={theme.primary}
        maximumTrackTintColor={theme.surfaceVariant}
        accessibilityLabel="Volume"
      />
      <Icon name="volume-high" size={20} color={theme.onSurfaceVariant} />
    </View>
  );
};
