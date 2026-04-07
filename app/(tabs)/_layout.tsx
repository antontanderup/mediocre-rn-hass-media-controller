import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components';
import { useThemeContext } from '@/context';
import { useAutoSelectPlayer, useTheme } from '@/hooks';

function ThemedTabs(): React.JSX.Element {
  const { theme } = useThemeContext();
  const colors = useTheme();
  const router = useRouter();

  useAutoSelectPlayer();

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
          title: 'Players',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="music-note" size={size} color={color} />
          ),
          headerRight: () => (
            <Pressable
              style={{ padding: 8, marginRight: 4 }}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
              accessibilityRole="button"
            >
              <Icon name="settings" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="player"
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
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            const state = navigation.getState();
            const playerRoute = state.routes.find(
              (r: { name: string; params?: unknown }) => r.name === 'player',
            );
            const entityId = (playerRoute?.params as { entityId?: string } | undefined)?.entityId;
            navigation.navigate('queue', entityId ? { entityId } : {});
          },
        })}
        options={{
          title: 'Queue',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="playlist-play" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            const state = navigation.getState();
            const playerRoute = state.routes.find(
              (r: { name: string; params?: unknown }) => r.name === 'player',
            );
            const entityId = (playerRoute?.params as { entityId?: string } | undefined)?.entityId;
            navigation.navigate('search', entityId ? { entityId } : {});
          },
        })}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browser"
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            const state = navigation.getState();
            const playerRoute = state.routes.find(
              (r: { name: string; params?: unknown }) => r.name === 'player',
            );
            const entityId = (playerRoute?.params as { entityId?: string } | undefined)?.entityId;
            navigation.navigate('browser', entityId ? { entityId } : {});
          },
        })}
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="library-music" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grouping"
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            // Forward the player tab's current entityId to the grouping tab
            const state = navigation.getState();
            const playerRoute = state.routes.find(
              (r: { name: string; params?: unknown }) => r.name === 'player',
            );
            const entityId = (playerRoute?.params as { entityId?: string } | undefined)?.entityId;
            navigation.navigate('grouping', entityId ? { entityId } : {});
          },
        })}
        options={{
          title: 'Grouping',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="speaker-group" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="customButtons"
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            const state = navigation.getState();
            const playerRoute = state.routes.find(
              (r: { name: string; params?: unknown }) => r.name === 'player',
            );
            const entityId = (playerRoute?.params as { entityId?: string } | undefined)?.entityId;
            navigation.navigate('customButtons', entityId ? { entityId } : {});
          },
        })}
        options={{
          title: 'Actions',
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="apps" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout(): React.JSX.Element {
  return <ThemedTabs />;
}
