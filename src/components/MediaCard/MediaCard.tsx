import { Image, Pressable, Text, View } from 'react-native';
import { createUseStyles } from '@/utils';
import type { MediaCardProps } from './MediaCard.types';

const STATE_LABELS: Record<string, string> = {
  playing: 'Playing',
  paused: 'Paused',
  idle: 'Idle',
  off: 'Off',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
  standby: 'Standby',
  buffering: 'Buffering',
};

const useStyles = createUseStyles(theme => ({
  card: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHigh,
  },
  artworkPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 24,
    color: theme.onSurfaceVariant,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.onSurface,
    flex: 1,
    marginRight: 8,
  },
  stateBadge: {
    backgroundColor: theme.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.onSecondaryContainer,
  },
  mediaTitle: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
    numberOfLines: 1,
  },
  mediaArtist: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
    opacity: 0.8,
    numberOfLines: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    fontSize: 16,
    color: theme.onPrimary,
  },
}));

export const MediaCard = ({ player, onPress, onPlayPause }: MediaCardProps): React.JSX.Element => {
  const styles = useStyles();
  const { attributes, state } = player;

  const name = attributes.friendly_name ?? player.entity_id;
  const stateLabel = STATE_LABELS[state] ?? state;
  const isPlaying = state === 'playing' || state === 'buffering';

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${name}, ${stateLabel}`}
      accessibilityRole="button"
    >
      {attributes.entity_picture ? (
        <Image source={{ uri: attributes.entity_picture }} style={styles.artwork} />
      ) : (
        <View style={styles.artworkPlaceholder}>
          <Text style={styles.artworkPlaceholderText}>♪</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.stateBadge}>
            <Text style={styles.stateLabel}>{stateLabel}</Text>
          </View>
        </View>
        {attributes.media_title ? (
          <Text style={styles.mediaTitle} numberOfLines={1}>{attributes.media_title}</Text>
        ) : null}
        {attributes.media_artist ? (
          <Text style={styles.mediaArtist} numberOfLines={1}>{attributes.media_artist}</Text>
        ) : null}
      </View>

      <Pressable
        style={styles.playButton}
        onPress={e => { e.stopPropagation?.(); onPlayPause(); }}
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        accessibilityRole="button"
      >
        <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
      </Pressable>
    </Pressable>
  );
};
