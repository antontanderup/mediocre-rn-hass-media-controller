import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { QueueItemProps } from './QueueItem.types';

const THUMB_SIZE = 40;

// Image style must be typed separately to satisfy ImageStyle constraints
const imageStyles = StyleSheet.create({
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 4,
  },
});

const useStyles = createUseStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowPlaying: {
    backgroundColor: theme.primaryContainer,
  },
  rowPressed: {
    opacity: 0.7,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 4,
    backgroundColor: theme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.onSurface,
  },
  titlePlaying: {
    color: theme.onPrimaryContainer,
  },
  subtitle: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
  subtitlePlaying: {
    color: theme.onPrimaryContainer,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 4,
  },
  actionBtnPressed: {
    opacity: 0.5,
  },
}));

export const QueueItem = ({
  item,
  onPress,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QueueItemProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const subtitle = [item.artist, item.album].filter(Boolean).join(' • ');
  const iconColor = item.isPlaying ? theme.onPrimaryContainer : theme.onSurfaceVariant;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, item.isPlaying && styles.rowPlaying, pressed && styles.rowPressed]}
      onPress={() => { haptics.light(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={`Play ${item.title}`}
    >
      <View style={styles.thumb}>
        {item.artworkUrl ? (
          <Image
            source={{ uri: item.artworkUrl }}
            style={imageStyles.thumb}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name="music-note" size={20} color={theme.onSurfaceVariant} />
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, item.isPlaying && styles.titlePlaying]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.subtitle, item.isPlaying && styles.subtitlePlaying]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {onMoveUp && !item.isFirst && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => { haptics.selection(); onMoveUp(); }}
            accessibilityRole="button"
            accessibilityLabel="Move up"
          >
            <Icon name="chevron-up" size={20} color={iconColor} />
          </Pressable>
        )}
        {onMoveDown && !item.isLast && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => { haptics.selection(); onMoveDown(); }}
            accessibilityRole="button"
            accessibilityLabel="Move down"
          >
            <Icon name="chevron-down" size={20} color={iconColor} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          onPress={() => { haptics.heavy(); onRemove(); }}
          accessibilityRole="button"
          accessibilityLabel="Remove from queue"
        >
          <Icon name="delete" size={20} color={iconColor} />
        </Pressable>
      </View>
    </Pressable>
  );
};
