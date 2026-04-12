import { Image, Text, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ButtonIcon, Icon, PlaybackControls, ProgressBar, SourceSelect, SpeakersSheet, VolumeSlider } from '@/components';
import { useHassContext } from '@/context';
import { useMediaPlayerControls, useSelectedPlayer, useTheme } from '@/hooks';
import type { PlaybackCommand } from '@/types';
import { createUseStyles, resolveHassUrl } from '@/utils';
import { t } from '@/localization';

export default function PlayerTab() {
  const { entityId, player } = useSelectedPlayer();
  const theme = useTheme();
  const { hassConfig } = useHassContext();
  const controls = useMediaPlayerControls(entityId ?? '');
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const handleCommand = (cmd: PlaybackCommand) => {
    switch (cmd.type) {
      case 'play':
        controls.play();
        break;
      case 'pause':
        controls.pause();
        break;
      case 'next':
        controls.nextTrack();
        break;
      case 'previous':
        controls.previousTrack();
        break;
      case 'shuffle':
        controls.setShuffle(cmd.shuffle);
        break;
      case 'repeat':
        controls.setRepeat(cmd.repeat);
        break;
    }
  };

  if (!player) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('nowPlaying.playerNotAvailable')}</Text>
      </View>
    );
  }

  const { attributes, state } = player;
  const name = attributes.friendly_name ?? player.entity_id;
  const position = attributes.media_position ?? 0;
  const positionUpdatedAt = attributes.media_position_updated_at;
  const duration = attributes.media_duration ?? 0;
  const volume = attributes.volume_level ?? 0;
  const isPlaying = state === 'playing';
  const isOff = state === 'off';

  const artworkUri =
    attributes.entity_picture && hassConfig
      ? resolveHassUrl(attributes.entity_picture, hassConfig)
      : null;

  const content = (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: insets.top,
          paddingBottom: 24,
        },
      ]}
    >
      <View style={styles.artworkContainer}>
        {artworkUri ? (
          <Image
            source={{ uri: artworkUri }}
            style={styles.artworkImage as ImageStyle}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.artworkPlaceholder}>
            <Icon name={isOff ? 'speaker' : 'music-note'} size={80} color={theme.onSurfaceVariant} />
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.triggerGroup}>
            {isOff ? (
              <Button
                variant="surface"
                size="sm"
                onPress={controls.turnOn}
                accessibilityLabel={t('nowPlaying.turnOn')}
              >
                <ButtonIcon name="power" />
              </Button>
            ) : attributes.source && attributes.source_list && attributes.source_list.length > 1 ? (
              <SourceSelect
                entityId={entityId ?? ''}
                source={attributes.source}
                sourceList={attributes.source_list}
              />
            ) : null}
            <SpeakersSheet entityId={entityId ?? ''} />
          </View>
        </View>
        {attributes.media_title ? (
          <Text style={styles.trackTitle} numberOfLines={2}>
            {attributes.media_title}
          </Text>
        ) : null}
        {attributes.media_artist ? (
          <Text style={styles.trackArtist} numberOfLines={1}>
            {attributes.media_artist}
          </Text>
        ) : null}
        {attributes.media_album_name ? (
          <Text style={styles.albumName} numberOfLines={1}>
            {attributes.media_album_name}
          </Text>
        ) : null}

        {duration > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar
              position={position}
              positionUpdatedAt={positionUpdatedAt}
              isPlaying={isPlaying}
              duration={duration}
            />
          </View>
        )}

        <View style={styles.controlsContainer}>
          <PlaybackControls player={player} onCommand={handleCommand} />
        </View>

        <View style={styles.volumeContainer}>
          <VolumeSlider volume={volume} onVolumeChange={controls.setVolume} />
        </View>
      </View>
    </View>
  );

  return <View style={styles.background}>{content}</View>;
}

const useStyles = createUseStyles(theme => ({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.background,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
  background: {
    flex: 1,
    backgroundColor: theme.background,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  artworkContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  artworkImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  artworkPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceContainerHigh,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    backgroundColor: theme.surfaceContainer,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  triggerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
    color: theme.onSurfaceVariant,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 28,
    color: theme.onSurface,
  },
  trackArtist: {
    fontSize: 15,
    marginBottom: 2,
    color: theme.onSurfaceVariant,
  },
  albumName: {
    fontSize: 13,
    marginBottom: 16,
    opacity: 0.8,
    color: theme.onSurfaceVariant,
  },
  progressContainer: {
    marginBottom: 20,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  volumeContainer: {},
}));
