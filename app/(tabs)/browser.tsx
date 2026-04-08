import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetSelect, HaMediaBrowser, Icon } from '@/components';
import { useHassContext } from '@/context';
import { useSelectedPlayer, useTheme } from '@/hooks';
import type { MediaBrowserEntry } from '@/types';
import { buildHassUrl, createUseStyles } from '@/utils';

function resolveEntries(
  entityId: string,
  mediaBrowserEntries?: MediaBrowserEntry[],
): MediaBrowserEntry[] {
  if (mediaBrowserEntries && mediaBrowserEntries.length > 0) {
    return mediaBrowserEntries;
  }
  return [{ entity_id: entityId }];
}

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.background,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  headerRightLabel: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    maxWidth: 120,
  },
}));

export default function BrowserTab() {
  const { entityId, config: playerConfig } = useSelectedPlayer();
  const theme = useTheme();
  const styles = useStyles();
  const { hassConfig } = useHassContext();
  const navigation = useNavigation();

  const entries = useMemo(
    () => (entityId ? resolveEntries(entityId, playerConfig?.mediaBrowserEntries) : []),
    [entityId, playerConfig?.mediaBrowserEntries],
  );
  const hasMultipleEntries = entries.length > 1;

  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    entries[0]?.entity_id ?? '',
  );

  // Reset selection when player changes or entries change
  const activeEntityId =
    entries.find(e => e.entity_id === selectedEntityId)?.entity_id ??
    entries[0]?.entity_id ??
    '';

  const activeLabel =
    entries.find(e => e.entity_id === activeEntityId)?.name ?? activeEntityId;

  const options = useMemo(
    () =>
      entries.map(entry => ({
        value: entry.entity_id,
        label: entry.name ?? entry.entity_id,
      })),
    [entries],
  );

  useLayoutEffect(() => {
    if (!hasMultipleEntries) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <BottomSheetSelect
          options={options}
          value={activeEntityId}
          onChange={setSelectedEntityId}
          title="Media source"
          renderTrigger={onOpen => (
            <Pressable
              style={styles.headerRight}
              onPress={onOpen}
              accessibilityRole="button"
              accessibilityLabel="Select media source"
            >
              <Text style={styles.headerRightLabel} numberOfLines={1}>
                {activeLabel}
              </Text>
              <Icon name="chevron-down" size={18} color={theme.onSurfaceVariant} />
            </Pressable>
          )}
        />
      ),
    });
  }, [
    navigation,
    hasMultipleEntries,
    options,
    activeEntityId,
    activeLabel,
    styles,
    theme,
  ]);

  if (!entityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Select a player to browse media</Text>
      </View>
    );
  }

  if (!hassConfig) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Not connected to Home Assistant</Text>
      </View>
    );
  }

  const hassBaseUrl = buildHassUrl(hassConfig);

  return (
    <View style={styles.container}>
      <HaMediaBrowser entityId={activeEntityId} hassBaseUrl={hassBaseUrl} />
    </View>
  );
}
