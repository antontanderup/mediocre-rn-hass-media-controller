import { Stack } from 'expo-router';
import { HassProvider, ThemeProvider } from '@/context';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <HassProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Media Players' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="player/[entityId]" options={{ title: 'Now Playing' }} />
          <Stack.Screen name="media-players" options={{ title: 'Media Players' }} />
          <Stack.Screen name="media-players/[index]" options={{ title: 'Player Settings' }} />
        </Stack>
      </HassProvider>
    </ThemeProvider>
  );
}
