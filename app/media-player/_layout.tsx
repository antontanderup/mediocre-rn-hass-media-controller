import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components';
import { useThemeContext } from '@/context';
import { useAppConfig, useSelectedPlayer, useTheme } from '@/hooks';

export default function MediaPlayerLayout(): React.JSX.Element {
  const { theme } = useThemeContext();
  const colors = useTheme();
  const router = useRouter();
  const { entityId } = useSelectedPlayer();
  const { config: appConfig } = useAppConfig();

  const playerConfig = appConfig?.mediaPlayers.find(p => p.entityId === entityId);
  const hasSearch = !!(playerConfig?.searchEntries?.length || playerConfig?.maEntityId);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.onSurface,
        tabBarStyle: { backgroundColor: theme.surface },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Now Playing',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="play-circle-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="playlist-play" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          href: hasSearch ? undefined : null,
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="music-box-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="speakers"
        options={{
          title: 'Speakers',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="speaker-multiple" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable
              style={{ padding: 8, marginRight: 4 }}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
              accessibilityRole="button"
            >
              <Icon name="cog" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="customButtons"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
