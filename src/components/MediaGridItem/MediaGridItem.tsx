import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
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

  return (
    <Pressable style={styles.container} onPress={onPress} accessibilityRole="button">
      <View style={styles.imageContainer}>
        {artworkUrl ? (
          <Image
            source={{ uri: artworkUrl }}
            style={imageStyles.image}
            accessibilityIgnoresInvertColors
          />
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

const imageStyles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.surfaceVariant,
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
