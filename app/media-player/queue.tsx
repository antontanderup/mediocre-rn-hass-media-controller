import { useFocusEffect } from '@react-navigation/core';
import { useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { BottomSheetSelect, Icon, QueueItem as QueueItemComponent } from '@/components';
import { usePlayerQueue, useSelectedPlayer, useTheme, useTransferQueue } from '@/hooks';
import type { QueueItem } from '@/types';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';

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
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 4,
  },
  iconBtn: {
    padding: 8,
  },
  iconBtnPressed: {
    opacity: 0.5,
  },
  list: {
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: theme.outlineVariant,
    marginLeft: 68,
  },
}));

export default function QueueTab() {
  const { entityId } = useSelectedPlayer();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();

  const { queue, loading, isAvailable, clearQueue, refetch } = usePlayerQueue(entityId ?? '');
  const { targets: transferTargets, transferQueue } = useTransferQueue(entityId ?? '');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  useLayoutEffect(() => {
    if (!isAvailable) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRow}>
          {transferTargets.length > 0 && (
            <BottomSheetSelect
              options={transferTargets.map(t => ({ value: t.entityId, label: t.label }))}
              value=""
              onChange={transferQueue}
              title={t('queue.transferQueue')}
              renderTrigger={onOpen => (
                <Pressable
                  style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                  onPress={onOpen}
                  accessibilityRole="button"
                  accessibilityLabel={t('queue.transferQueue')}
                >
                  <Icon name="transfer" size={24} color={theme.onSurfaceVariant} />
                </Pressable>
              )}
            />
          )}
          {queue.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
              onPress={clearQueue}
              accessibilityRole="button"
              accessibilityLabel={t('queue.clearQueue')}
            >
              <Icon name="delete-sweep" size={24} color={theme.primary} />
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
            onPress={refetch}
            accessibilityRole="button"
            accessibilityLabel={t('queue.refresh')}
          >
            <Icon name="refresh" size={24} color={theme.onSurfaceVariant} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, isAvailable, transferTargets, transferQueue, queue.length, clearQueue, refetch, styles.headerRow, styles.iconBtn, styles.iconBtnPressed, theme.primary, theme.onSurfaceVariant]);

  if (!isAvailable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('queue.notAvailable')}</Text>
      </View>
    );
  }

  if (loading && queue.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!loading && queue.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>{t('queue.empty')}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: QueueItem }) => {
    const handleMoveUp = item.moveItemUp
      ? () => {
          item.moveItemUp?.();
        }
      : item.moveItem
        ? () => {
            item.moveItem?.(item.playlistIndex - 1);
          }
        : undefined;

    const handleMoveDown = item.moveItemDown
      ? () => {
          item.moveItemDown?.();
        }
      : item.moveItem
        ? () => {
            item.moveItem?.(item.playlistIndex + 1);
          }
        : undefined;

    return (
      <QueueItemComponent
        item={item}
        onPress={() => item.skipToItem()}
        onRemove={() => item.deleteItem()}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        data={queue}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentInsetAdjustmentBehavior="automatic"
      />
    </View>
  );
}
