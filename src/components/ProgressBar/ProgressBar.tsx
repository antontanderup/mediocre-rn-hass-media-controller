import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { createUseStyles, formatDuration } from '@/utils';
import type { ProgressBarProps } from './ProgressBar.types';

const useStyles = createUseStyles(theme => ({
  container: {
    gap: 6,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.surfaceVariant,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.primary,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    color: theme.onSurfaceVariant,
  },
}));

export const ProgressBar = ({
  position,
  positionUpdatedAt,
  isPlaying,
  duration,
}: ProgressBarProps): React.JSX.Element => {
  const styles = useStyles();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTick((prev: number) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentPosition = useMemo(() => {
    if (!positionUpdatedAt) return position;
    const now = new Date();
    const lastUpdate = new Date(positionUpdatedAt);
    const elapsed = (now.getTime() - lastUpdate.getTime()) / 1000;
    return position + elapsed;
    // tick is intentionally included to re-run every second while playing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, positionUpdatedAt, tick]);

  const clampedPosition = Math.min(Math.max(currentPosition, 0), duration);
  const progress = duration > 0 ? Math.min(clampedPosition / duration, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{formatDuration(clampedPosition)}</Text>
        <Text style={styles.label}>{formatDuration(duration)}</Text>
      </View>
    </View>
  );
};
