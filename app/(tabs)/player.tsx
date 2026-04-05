import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, PlaybackControls, ProgressBar, VolumeSlider } from '@/components';
import { useActivePlayer, useHassContext } from '@/context';
import { useAppConfig, useMediaPlayerControls, useTheme } from '@/hooks';
import type { PlaybackCommand } from '@/types';
import { createUseStyles } from '@/utils';

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
  const { activePlayerId } = useActivePlayer();
  const theme = useTheme();
  const router = useRouter();
  const { players } = useHassContext();
  const controls = useMediaPlayerControls(activePlayerId ?? '');
  const { config: appConfig } = useAppConfig();
  const emptyStyles = useEmptyStyles();

  const hasGroupableEntities =
    (appConfig?.mediaPlayers.some(p => p.canBeGrouped) ?? false) ||
    !(appConfig?.options.disablePlayerFocusSwitching ?? false);

  const player = players.find(p => p.entity_id === activePlayerId);

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
    }
  };

  if (!player) {
    return (
      <View style={emptyStyles.container}>
        <Text style={emptyStyles.text}>Select a player from the Players tab.</Text>
      </View>
    );
  }

  const { attributes } = player;
  const name = attributes.friendly_name ?? player.entity_id;
  const position = attributes.media_position ?? 0;
  const duration = attributes.media_duration ?? 0;
  const volume = attributes.volume_level ?? 0;

  const content = (
    <View style={[styles.overlay, { backgroundColor: `${theme.scrim}CC` }]}>
      <View style={styles.artworkContainer}>
        {!attributes.entity_picture && (
          <View style={[styles.artworkPlaceholder, { backgroundColor: theme.surfaceContainerHigh }]}>
            <Icon name="music-line" size={80} color={theme.onSurfaceVariant} />
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

        {duration > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar position={position} duration={duration} />
          </View>
        )}

        <View style={styles.controlsContainer}>
          <PlaybackControls player={player} onCommand={handleCommand} />
        </View>

        <View style={styles.volumeContainer}>
          <VolumeSlider volume={volume} onVolumeChange={controls.setVolume} />
        </View>

        {hasGroupableEntities && (
          <Pressable
            style={[styles.groupingButton, { borderTopColor: theme.outlineVariant }]}
            onPress={() => router.push('/(tabs)/grouping')}
            accessibilityRole="button"
            accessibilityLabel="Speaker Grouping"
          >
            <Icon name="speaker-2-line" size={18} color={theme.onSurfaceVariant} />
            <Text style={[styles.groupingButtonText, { color: theme.onSurface }]}>
              Speaker Grouping
            </Text>
            <Icon name="arrow-right-s-line" size={18} color={theme.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
    </View>
  );

  if (attributes.entity_picture) {
    return (
      <ImageBackground
        source={{ uri: attributes.entity_picture }}
        style={styles.background}
        blurRadius={20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.background, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    paddingBottom: 32,
  },
  artworkContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  artworkPlaceholder: {
    width: 200,
    height: 200,
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
  progressContainer: {
    marginBottom: 20,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  volumeContainer: {},
  groupingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  groupingButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
