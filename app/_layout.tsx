import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HassProvider, ThemeProvider, useThemeContext } from '@/context';

function ThemedStack(): React.JSX.Element {
  const { theme } = useThemeContext();
  const headerStyle = { backgroundColor: theme.surface };
  const headerTintColor = theme.onSurface;

  return (
    <Stack screenOptions={{ headerStyle, headerTintColor }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
      <Stack.Screen name="media-players" options={{ title: 'Media Players' }} />
      <Stack.Screen name="media-players/[index]" options={{ title: 'Player Settings' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <HassProvider>
          <ThemedStack />
        </HassProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
