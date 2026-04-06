import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import type { MediaBrowserItemProps } from './MediaBrowserItem.types';

// ─── Icon mapping ────────────────────────────────────────────────────────────

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
    case 'genre':
      return 'folder-music-line';
    case 'podcast':
      return 'mic-line';
    case 'app':
      return 'apps-line';
    case 'directory':
      return 'folder-line';
    default:
      return 'folder-line';
  }
}

function resolveThumb(thumb: string | undefined, hassBaseUrl: string): string | undefined {
  if (!thumb) return undefined;
  if (/^https?:\/\//i.test(thumb)) return thumb;
  return `${hassBaseUrl}${thumb}`;
}

// ─── Grid variant (folder / album tile) ──────────────────────────────────────

const GridItem = ({
  node,
  hassBaseUrl,
  onPress,
  onPlay,
}: MediaBrowserItemProps): React.JSX.Element => {
  const styles = useGridStyles();
  const theme = useTheme();
  const thumbUri = resolveThumb(node.thumbnail, hassBaseUrl);

  const handlePress = () => {
    if (node.canExpand) {
      onPress(node);
    } else if (node.canPlay) {
      onPlay(node);
    }
  };

  return (
    <Pressable style={styles.container} onPress={handlePress} accessibilityRole="button">
      <View style={styles.imageContainer}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={imageStyles.gridImage} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.iconFallback}>
            <Icon
              name={iconForMediaClass(node.childrenMediaClass ?? node.mediaClass)}
              size={32}
              color={theme.onSurfaceVariant}
            />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {node.title}
      </Text>
    </Pressable>
  );
};

// ─── Track variant (list row) ────────────────────────────────────────────────

const TrackItem = ({
  node,
  hassBaseUrl,
  onPress,
  onPlay,
}: MediaBrowserItemProps): React.JSX.Element => {
  const styles = useTrackStyles();
  const theme = useTheme();
  const thumbUri = resolveThumb(node.thumbnail, hassBaseUrl);

  const handlePress = () => {
    if (node.canExpand) {
      onPress(node);
    } else if (node.canPlay) {
      onPlay(node);
    }
  };

  return (
    <Pressable style={styles.row} onPress={handlePress} accessibilityRole="button">
      <View style={styles.thumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={imageStyles.trackThumb} accessibilityIgnoresInvertColors />
        ) : (
          <Icon
            name={iconForMediaClass(node.mediaClass)}
            size={20}
            color={theme.onSurfaceVariant}
          />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {node.title}
      </Text>
      {node.canPlay && (
        <Pressable
          style={styles.playBtn}
          onPress={() => onPlay(node)}
          accessibilityRole="button"
          accessibilityLabel={`Play ${node.title}`}
        >
          <Icon name="play-circle-line" size={20} color={theme.primary} />
        </Pressable>
      )}
      {node.canExpand && (
        <Icon name="arrow-right-s-line" size={20} color={theme.onSurfaceVariant} />
      )}
    </Pressable>
  );
};

// ─── Exported component ──────────────────────────────────────────────────────

export const MediaBrowserItem = (props: MediaBrowserItemProps): React.JSX.Element => {
  return props.variant === 'track' ? <TrackItem {...props} /> : <GridItem {...props} />;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const THUMB_SIZE = 44;

const imageStyles = StyleSheet.create({
  gridImage: {
    width: '100%',
    height: '100%',
  },
  trackThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
  },
});

const useGridStyles = createUseStyles(theme => ({
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

const useTrackStyles = createUseStyles(theme => ({
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
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.onSurface,
  },
  playBtn: {
    padding: 6,
  },
}));
