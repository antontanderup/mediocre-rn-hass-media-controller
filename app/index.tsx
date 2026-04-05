import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useHassContext } from '@/context';
import { ERR_CANNOT_CONNECT, ERR_CONNECTION_LOST, ERR_INVALID_HTTPS_TO_HTTP, useAppConfig, useHassConfig, usePingHass, useTheme } from '@/hooks';
import { Icon } from '@/components';
import type { MediaPlayerEntity } from '@/types';
import { buildHassUrl, createUseStyles } from '@/utils';
import { PlayerCardItem } from './_components/PlayerCardItem';

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  headerSettingsButton: {
    padding: 8,
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

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useStyles();
  const { players, isLoading, authState, connectionErrorCode, isConfigLoaded, hasConfig } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const { config: hassConfig } = useHassConfig();

  // If players are configured, filter and order by config; otherwise show all.
  const displayedPlayers: { player: MediaPlayerEntity; nameOverride?: string }[] =
    useMemo(() => {
      const configured = appConfig?.mediaPlayers;
      if (!configured?.length) {
        return players.map(p => ({ player: p }));
      }
      return configured
        .map(cfg => {
          const entity = players.find(p => p.entity_id === cfg.entityId);
          if (!entity) return null;
          return {
            player: entity,
            nameOverride: cfg.name ?? undefined,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    }, [players, appConfig]);

  useEffect(() => {
    if (authState === 'auth_invalid') {
      router.replace('/settings?error=invalid_token');
    }
  }, [authState, router]);

  const showError = authState === 'error';

  const pingResult = usePingHass(hassConfig, showError);

  const connectionErrorMessage = (() => {
    if (!showError) return null;

    let base: string;
    if (connectionErrorCode === ERR_CANNOT_CONNECT) {
      const attempted = hassConfig ? ` (${buildHassUrl(hassConfig)})` : '';
      base = `Could not connect to Home Assistant${attempted}. Check your host, port, and SSL settings — or verify Home Assistant is running and reachable. If settings look correct, your token may also be invalid.`;
    } else if (connectionErrorCode === ERR_INVALID_HTTPS_TO_HTTP) {
      base = 'SSL mismatch: the server responded over HTTP but SSL is enabled. Disable SSL in settings.';
    } else if (connectionErrorCode === ERR_CONNECTION_LOST) {
      base = 'Connection to Home Assistant was lost. Attempting to reconnect…';
    } else {
      base = 'Unable to connect to Home Assistant. Check your settings.';
    }

    if (pingResult === null) {
      return `${base}\n\nPing: checking…`;
    }
    if (pingResult.reachable) {
      return `${base}\n\nPing: OK — HTTP ${pingResult.statusCode} in ${pingResult.latencyMs} ms. Server is reachable; the issue is specific to the WebSocket connection.`;
    }
    return `${base}\n\nPing: FAILED — ${pingResult.error ?? 'no response'} (${pingResult.latencyMs} ms). Server does not appear to be reachable.`;
  })();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={styles.headerSettingsButton}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
              accessibilityRole="button"
            >
              <Icon name="settings-4-line" size={22} color={theme.onSurfaceVariant} />
            </Pressable>
          ),
        }}
      />

      {connectionErrorMessage !== null && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionBannerText}>{connectionErrorMessage}</Text>
        </View>
      )}

      <FlatList
        data={displayedPlayers}
        keyExtractor={({ player }) => player.entity_id}
        contentContainerStyle={displayedPlayers.length === 0 ? { flex: 1 } : styles.listContent}
        renderItem={({ item: { player, nameOverride } }) => (
          <PlayerCardItem
            player={player}
            nameOverride={nameOverride}
            onPress={() => router.push(`/player/${player.entity_id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {!isConfigLoaded || (hasConfig && isLoading && authState !== 'error') ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <Text style={styles.emptyText}>
                {!hasConfig
                  ? 'Configure your Home Assistant instance in settings.'
                  : authState === 'authenticated'
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
