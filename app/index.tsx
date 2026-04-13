import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, ButtonText } from '@/components';
import { useHassContext, useSelectedPlayerContext } from '@/context';
import {
  ERR_CANNOT_CONNECT,
  ERR_CONNECTION_LOST,
  ERR_INVALID_HTTPS_TO_HTTP,
  useAppConfig,
  useTheme,
} from '@/hooks';
import { t } from '@/localization';
import type { HassAuthState } from '@/types';
import { createUseStyles, selectActiveMediaPlayer } from '@/utils';

const STATUS_MESSAGES: Record<HassAuthState, string> = {
  connecting: t('connecting.status.connecting'),
  authenticating: t('connecting.status.authenticating'),
  authenticated: t('connecting.status.authenticated'),
  error: t('connecting.status.error'),
  auth_invalid: t('connecting.status.authInvalid'),
};

function getErrorDescription(code: number | null): string {
  if (code === ERR_CANNOT_CONNECT) return t('connecting.error.cannotConnect');
  if (code === ERR_CONNECTION_LOST) return t('connecting.error.connectionLost');
  if (code === ERR_INVALID_HTTPS_TO_HTTP) return t('connecting.error.sslMismatch');
  return t('connecting.error.unknown');
}

export default function IndexRedirect() {
  const router = useRouter();
  const theme = useTheme();
  const { players, entities, authState, connectionErrorCode, isConfigLoaded, hasConfig } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const { setEntityId } = useSelectedPlayerContext();
  const hasRedirected = useRef(false);
  const styles = useStyles();

  useEffect(() => {
    if (hasRedirected.current) return;
    if (!players.length) return;

    const activeEntityId = selectActiveMediaPlayer({
      players,
      entities,
      config: appConfig,
    });

    if (activeEntityId) {
      hasRedirected.current = true;
      setEntityId(activeEntityId);
      router.replace('/media-player');
    }
  }, [players, entities, appConfig, setEntityId, router]);

  // Not configured — go to settings
  if (isConfigLoaded && !hasConfig) {
    return <Redirect href="/settings" />;
  }

  // Auth invalid — go to settings with error
  if (authState === 'auth_invalid') {
    return <Redirect href="/settings?error=invalid_token" />;
  }

  const isError = authState === 'error';
  const statusMessage = STATUS_MESSAGES[authState];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {!isError && <ActivityIndicator size="large" color={theme.primary} />}
        <Text style={styles.status}>{statusMessage}</Text>
        {isError && (
          <Text style={styles.description}>{getErrorDescription(connectionErrorCode)}</Text>
        )}
      </View>
      <Button
        variant="outlined"
        onPress={() => router.push('/settings')}
        style={styles.settingsButton}
        accessibilityLabel="Open settings"
      >
        <ButtonText>{t('connecting.openSettings')}</ButtonText>
      </Button>
    </View>
  );
}

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    padding: 24,
    gap: 32,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  status: {
    color: theme.onBackground,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: theme.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  settingsButton: {
    minWidth: 160,
  },
}));
