import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetSelect, Button, ButtonIcon, ButtonText, HaMediaBrowser } from '@/components';
import { useHassContext } from '@/context';
import { useSelectedPlayer } from '@/hooks';
import type { MediaBrowserEntry } from '@/types';
import { buildHassUrl, createUseStyles } from '@/utils';
import { t } from '@/localization';

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
}));

export default function BrowserTab() {
  const { entityId, config: playerConfig } = useSelectedPlayer();
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
        <View style={{ marginRight: 8 }}>
          <BottomSheetSelect
            options={options}
            value={activeEntityId}
            onChange={setSelectedEntityId}
            title={t('browser.mediaSource')}
            renderTrigger={onOpen => (
              <Button
                variant="surface"
                size="sm"
                onPress={onOpen}
                accessibilityLabel={t('browser.selectMediaSource')}
              >
                <ButtonText numberOfLines={1} style={{ maxWidth: 120 }}>
                  {activeLabel}
                </ButtonText>
                <ButtonIcon name="chevron-down" />
              </Button>
            )}
          />
        </View>
      ),
    });
  }, [
    navigation,
    hasMultipleEntries,
    options,
    activeEntityId,
    activeLabel,
  ]);

  if (!entityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>{t('browser.selectPlayer')}</Text>
      </View>
    );
  }

  if (!hassConfig) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>{t('browser.notConnected')}</Text>
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
