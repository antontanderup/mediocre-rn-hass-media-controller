import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useHassContext, useSelectedPlayerContext } from '@/context';
import { useAppConfig, useTheme } from '@/hooks';
import { selectActiveMediaPlayer } from '@/utils';

export default function IndexRedirect() {
  const router = useRouter();
  const theme = useTheme();
  const { players, entities, authState, isConfigLoaded, hasConfig } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const { setEntityId } = useSelectedPlayerContext();
  const hasRedirected = useRef(false);

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

  // Loading
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}
