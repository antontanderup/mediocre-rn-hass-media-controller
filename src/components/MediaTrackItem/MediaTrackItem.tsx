import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { MediaTrackItemProps } from './MediaTrackItem.types';

const THUMB_SIZE = 44;

export const MediaTrackItem = ({
  title,
  subtitle,
  artworkUrl,
  fallbackIcon = 'music-note',
  onPress,
  onPlay,
  showChevron,
}: MediaTrackItemProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <Pressable
      style={styles.row}
      onPress={onPress ?? onPlay}
      accessibilityRole="button"
    >
      <View style={styles.thumb}>
        {artworkUrl ? (
          <Image
            source={{ uri: artworkUrl }}
            style={imageStyles.thumb}
            accessibilityIgnoresInvertColors
          />
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
          style={styles.playBtn}
          onPress={onPlay}
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
};

const imageStyles = StyleSheet.create({
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
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
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
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
  subtitle: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
  playBtn: {
    padding: 6,
  },
}));
