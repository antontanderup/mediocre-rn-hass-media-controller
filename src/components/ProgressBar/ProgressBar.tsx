import { Text, View } from 'react-native';
import { formatDuration } from '@/utils';
import { createUseStyles } from '@/utils';
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

export const ProgressBar = ({ position, duration }: ProgressBarProps): React.JSX.Element => {
  const styles = useStyles();
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>{formatDuration(position)}</Text>
        <Text style={styles.label}>{formatDuration(duration)}</Text>
      </View>
    </View>
  );
};
