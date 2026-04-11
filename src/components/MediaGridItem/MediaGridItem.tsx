import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ImageStyle } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import { MediaArtwork } from '@/components/MediaArtwork';
import type { MediaGridItemProps } from './MediaGridItem.types';

export const MediaGridItem = ({
  title,
  artworkUrl,
  fallbackIcon = 'folder',
  onPress,
  onLongPress,
}: MediaGridItemProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => { haptics.light(); onPress(); }}
      onLongPress={onLongPress}
      accessibilityRole="button"
    >
      <View style={styles.imageContainer}>
        {artworkUrl ? (
          <MediaArtwork uri={artworkUrl} style={styles.fill as ImageStyle} />
        ) : (
          <View style={styles.iconFallback}>
            <Icon name={fallbackIcon} size={32} color={theme.onSurfaceVariant} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
    </Pressable>
  );
};

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.surfaceVariant,
  },
  fill: {
    width: '100%' as unknown as number,
    height: '100%' as unknown as number,
  },
  iconFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: theme.onSurface,
    textAlign: 'center',
    width: '100%',
  },
}));
