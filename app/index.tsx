import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { MediaCard } from '@/components';
import { useHassContext } from '@/context';
import { useMediaPlayerControls, useTheme } from '@/hooks';
import type { MediaPlayerEntity } from '@/types';
import { createUseStyles } from '@/utils';

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.onBackground,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
    color: theme.onSurfaceVariant,
  },
  connectionBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.errorContainer,
  },
  connectionBannerText: {
    fontSize: 13,
    color: theme.onErrorContainer,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
}));

interface PlayerCardItemProps {
  player: MediaPlayerEntity;
  onPress: () => void;
}

const PlayerCardItem = ({ player, onPress }: PlayerCardItemProps): React.JSX.Element => {
  const controls = useMediaPlayerControls(player.entity_id);
  const isPlaying = player.state === 'playing' || player.state === 'buffering';

  return (
    <MediaCard
      player={player}
      onPress={onPress}
      onPlayPause={() => (isPlaying ? controls.pause() : controls.play())}
    />
  );
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useStyles();
  const { players, isLoading, authState } = useHassContext();

  const showError = authState === 'error';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media Players</Text>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      {showError && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>
            Unable to connect to Home Assistant. Check your settings.
          </Text>
        </View>
      )}

      <FlatList
        data={players}
        keyExtractor={p => p.entity_id}
        contentContainerStyle={players.length === 0 ? { flex: 1 } : styles.listContent}
        renderItem={({ item }) => (
          <PlayerCardItem
            player={item}
            onPress={() => router.push(`/player/${item.entity_id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading && authState !== 'error' ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <Text style={styles.emptyText}>
                {authState === 'authenticated'
                  ? 'No media players found.'
                  : 'Configure your Home Assistant instance in settings.'}
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
