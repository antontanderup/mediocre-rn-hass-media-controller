import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PlaybackControls, ProgressBar, SourceSelect, VolumeSlider } from '@/components';
import { useHassContext } from '@/context';
import { useMediaPlayerControls, useSelectedPlayer, useTheme } from '@/hooks';
import type { PlaybackCommand } from '@/types';
import { createUseStyles, resolveHassUrl } from '@/utils';

const useEmptyStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.background,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
}));

export default function PlayerTab() {
  const { entityId, player } = useSelectedPlayer();
  const theme = useTheme();
  const { hassConfig } = useHassContext();
  const controls = useMediaPlayerControls(entityId ?? '');
  const emptyStyles = useEmptyStyles();
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
      <View style={emptyStyles.container}>
        <Text style={emptyStyles.text}>Player not available.</Text>
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

  const artworkUri =
    attributes.entity_picture && hassConfig
      ? resolveHassUrl(attributes.entity_picture, hassConfig)
      : null;

  const content = (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: `${theme.scrim}CC`,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.artworkContainer}>
        {artworkUri ? (
          <Image
            source={{ uri: artworkUri }}
            style={styles.artworkImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.artworkPlaceholder, { backgroundColor: theme.surfaceContainerHigh }]}>
            <Icon name="music-note" size={80} color={theme.onSurfaceVariant} />
          </View>
        )}
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.surfaceContainer }]}>
        <Text style={[styles.playerName, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
          {name}
        </Text>
        {attributes.media_title ? (
          <Text style={[styles.trackTitle, { color: theme.onSurface }]} numberOfLines={2}>
            {attributes.media_title}
          </Text>
        ) : null}
        {attributes.media_artist ? (
          <Text style={[styles.trackArtist, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            {attributes.media_artist}
          </Text>
        ) : null}
        {attributes.media_album_name ? (
          <Text style={[styles.albumName, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
            {attributes.media_album_name}
          </Text>
        ) : null}

        {attributes.source && attributes.source_list && attributes.source_list.length > 1 ? (
          <View style={styles.sourceContainer}>
            <SourceSelect
              entityId={entityId ?? ''}
              source={attributes.source}
              sourceList={attributes.source_list}
            />
          </View>
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

  if (artworkUri) {
    return (
      <ImageBackground source={{ uri: artworkUri }} style={styles.background} blurRadius={20}>
        {content}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: theme.background }]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  artworkContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
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
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
  },
  playerName: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 28,
  },
  trackArtist: {
    fontSize: 15,
    marginBottom: 2,
  },
  albumName: {
    fontSize: 13,
    marginBottom: 16,
    opacity: 0.8,
  },
  sourceContainer: {
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  volumeContainer: {},
});
