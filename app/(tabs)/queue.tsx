import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { QueueItem as QueueItemComponent } from '@/components';
import { usePlayerQueue, useSelectedPlayer, useTheme } from '@/hooks';
import type { QueueItem } from '@/types';
import { createUseStyles } from '@/utils';

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
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: theme.primary,
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

  const { queue, loading, isAvailable, clearQueue } = usePlayerQueue(entityId ?? '');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        queue.length > 0 ? (
          <Pressable
            style={styles.clearBtn}
            onPress={clearQueue}
            accessibilityRole="button"
            accessibilityLabel="Clear queue"
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, queue.length, clearQueue, styles.clearBtn, styles.clearBtnText]);

  if (!isAvailable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Queue not available — configure Music Assistant or Lyrion Media Server for this player
          in Settings.
        </Text>
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
        <Text style={styles.emptyText}>Queue is empty</Text>
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
