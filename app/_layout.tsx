import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HassProvider, SelectedPlayerProvider, ThemeProvider, useThemeContext } from '@/context';

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
