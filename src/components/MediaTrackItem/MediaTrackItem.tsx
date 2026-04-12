import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import { MediaArtwork } from '@/components/MediaArtwork';
import type { MediaTrackItemProps } from './MediaTrackItem.types';

const THUMB_SIZE = 44;

export const MediaTrackItem = React.memo(function MediaTrackItem({
  title,
  subtitle,
  artworkUrl,
  fallbackIcon = 'music-note',
  onPress,
  onPlay,
  showChevron,
}: MediaTrackItemProps): React.JSX.Element {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const handleRowPress = () => {
    haptics.light();
    if (onPress) {
      onPress();
    } else {
      onPlay?.();
    }
  };

  const handlePlayPress = () => {
    haptics.medium();
    onPlay?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={handleRowPress}
      accessibilityRole="button"
    >
      <View style={styles.thumb}>
        {artworkUrl ? (
          <MediaArtwork uri={artworkUrl} style={styles.thumbImage as ImageStyle} />
        ) : (
          <Icon name={fallbackIcon} size={20} color={theme.onSurfaceVariant} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {onPlay && (
        <Pressable
          style={({ pressed }) => [styles.playBtn, pressed && styles.playBtnPressed]}
          onPress={handlePlayPress}
          accessibilityRole="button"
          accessibilityLabel={`Play ${title}`}
        >
          <Icon name="play-circle-outline" size={20} color={theme.primary} />
        </Pressable>
      )}
      {showChevron && (
        <Icon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
      )}
    </Pressable>
  );
});

const useStyles = createUseStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowPressed: {
    opacity: 0.7,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    backgroundColor: theme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
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
  subtitle: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
  playBtn: {
    padding: 6,
  },
  playBtnPressed: {
    opacity: 0.5,
  },
}));
