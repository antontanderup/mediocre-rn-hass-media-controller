import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Button, ButtonIcon, Icon } from '@/components';
import { useThemeContext } from '@/context';
import { useAppConfig, useSelectedPlayer, useTheme } from '@/hooks';
import { t } from '@/localization';

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
          title: t('tabs.nowPlaying'),
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="play-circle-outline" size={size} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: t('tabs.queue'),
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="playlist-play" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          href: hasSearch ? undefined : null,
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: t('tabs.browse'),
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="music-box-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="speakers"
        options={{
          title: t('tabs.speakers'),
          tabBarIcon: ({ color, size }: { color: string; size: number; focused: boolean }) => (
            <Icon name="speaker-multiple" size={size} color={color} />
          ),
          headerRight: () => (
            <Button
              variant="subtle"
              size="sm"
              onPress={() => router.push('/settings')}
              accessibilityLabel={t('tabs.openSettings')}
              style={{ marginRight: 8 }}
            >
              <ButtonIcon name="cog" />
            </Button>
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
