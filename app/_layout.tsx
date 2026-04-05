import { Stack } from 'expo-router';
import React from 'react';
import { HassProvider, ThemeProvider, useThemeContext } from '@/context';

function ThemedStack(): React.JSX.Element {
  const { theme } = useThemeContext();
  const headerStyle = { backgroundColor: theme.surface };
  const headerTintColor = theme.onSurface;

  return (
    <Stack screenOptions={{ headerStyle, headerTintColor }}>
      <Stack.Screen name="index" options={{ title: 'Media Players' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="player/[entityId]" options={{ title: 'Now Playing' }} />
      <Stack.Screen name="media-players" options={{ title: 'Media Players' }} />
      <Stack.Screen name="media-players/[index]" options={{ title: 'Player Settings' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <HassProvider>
        <ThemedStack />
      </HassProvider>
    </ThemeProvider>
  );
}
