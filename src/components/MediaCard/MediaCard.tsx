import { Image, Pressable, Text, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import { useHassContext } from '@/context';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles, resolveHassUrl } from '@/utils';
import { t } from '@/localization';
import { Icon } from '@/components/Icon';
import type { MediaCardProps } from './MediaCard.types';

const STATE_LABELS: Record<string, string> = {
  playing: t('mediaCard.state.playing'),
  paused: t('mediaCard.state.paused'),
  idle: t('mediaCard.state.idle'),
  off: t('mediaCard.state.off'),
  unavailable: t('mediaCard.state.unavailable'),
  unknown: t('mediaCard.state.unknown'),
  standby: t('mediaCard.state.standby'),
  buffering: t('mediaCard.state.buffering'),
};

const useStyles = createUseStyles(theme => ({
  card: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.85,
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
  playButtonPressed: {
    opacity: 0.7,
  },
}));

export const MediaCard = ({ player, onPress, onPlayPause, nameOverride, isActive }: MediaCardProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();
  const { hassConfig } = useHassContext();
  const { attributes, state } = player;

  const name = nameOverride ?? attributes.friendly_name ?? player.entity_id;
  const stateLabel = STATE_LABELS[state] ?? state;
  const isPlaying = state === 'playing' || state === 'buffering';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderWidth: 2, borderColor: isActive ? theme.primary : theme.surfaceContainer }, pressed && styles.cardPressed]}
      onPress={() => { haptics.light(); onPress(); }}
      accessibilityLabel={`${name}, ${stateLabel}${isActive ? ', selected' : ''}`}
      accessibilityRole="button"
    >
      {attributes.entity_picture && hassConfig ? (
        <Image source={{ uri: resolveHassUrl(attributes.entity_picture, hassConfig) }} style={styles.artwork as ImageStyle} />
      ) : (
        <View style={styles.artworkPlaceholder}>
          <Icon name="music-note" size={28} color={theme.onSurfaceVariant} />
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
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        onPress={e => { e.stopPropagation?.(); haptics.medium(); onPlayPause(); }}
        accessibilityLabel={isPlaying ? t('mediaCard.pause') : t('mediaCard.play')}
        accessibilityRole="button"
      >
        <Icon name={isPlaying ? 'pause' : 'play'} size={18} color={theme.onPrimary} />
      </Pressable>
    </Pressable>
  );
};
