import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import type { SearchResultItemProps } from './SearchResultItem.types';

const THUMB_SIZE = 44;

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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    padding: 6,
  },
}));

function iconForMediaClass(mediaClass: string | undefined): IconName {
  switch (mediaClass) {
    case 'track':
    case 'music':
      return 'music-2-line';
    case 'album':
      return 'album-line';
    case 'artist':
      return 'user-3-line';
    case 'playlist':
      return 'play-list-2-line';
    case 'radio':
      return 'radio-line';
    case 'audiobook':
      return 'book-open-line';
    case 'podcast':
      return 'mic-line';
    default:
      return 'music-2-line';
  }
}

export const SearchResultItem = ({
  title,
  subtitle,
  thumbnail,
  mediaClass,
  onPlay,
  onEnqueue,
}: SearchResultItemProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={imageStyles.thumb}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Icon name={iconForMediaClass(mediaClass)} size={20} color={theme.onSurfaceVariant} />
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

      <View style={styles.actions}>
        {onEnqueue && (
          <Pressable
            style={styles.actionBtn}
            onPress={onEnqueue}
            accessibilityRole="button"
            accessibilityLabel={`Add ${title} to queue`}
          >
            <Icon name="add-line" size={20} color={theme.onSurfaceVariant} />
          </Pressable>
        )}
        <Pressable
          style={styles.actionBtn}
          onPress={onPlay}
          accessibilityRole="button"
          accessibilityLabel={`Play ${title}`}
        >
          <Icon name="play-circle-line" size={20} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
};
