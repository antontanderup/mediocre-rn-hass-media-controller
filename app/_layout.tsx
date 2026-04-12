import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HassProvider, SelectedPlayerProvider, ThemeProvider, useHassContext, useThemeContext } from '@/context';
import { useArtworkColor, useSelectedPlayer } from '@/hooks';
import { resolveHassUrl } from '@/utils';

function ArtworkThemeSync(): null {
  const { player } = useSelectedPlayer();
  const { hassConfig } = useHassContext();
  const { setArtworkColor } = useThemeContext();

  const artworkUri =
    player?.attributes.entity_picture && hassConfig
      ? resolveHassUrl(player.attributes.entity_picture, hassConfig)
      : null;

  const artworkColor = useArtworkColor(artworkUri);

  useEffect(() => {
    setArtworkColor(artworkColor);
  }, [artworkColor, setArtworkColor]);

  return null;
}

function ThemedStack(): React.JSX.Element {
  const { theme } = useThemeContext();
  const headerStyle = { backgroundColor: theme.surface };
  const headerTintColor = theme.onSurface;

  return (
    <>
      <StatusBar style={theme.colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerStyle, headerTintColor }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="media-player" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
      <Stack.Screen name="media-players" options={{ title: 'Media Players' }} />
      <Stack.Screen name="media-players/[index]" options={{ title: 'Player Settings' }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <HassProvider>
          <SelectedPlayerProvider>
            <ArtworkThemeSync />
            <ThemedStack />
          </SelectedPlayerProvider>
        </HassProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
