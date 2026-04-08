import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme, useMediaBrowser } from '@/hooks';
import { createUseStyles, iconForMediaClass, resolveArtworkUrl } from '@/utils';
import { Icon } from '@/components/Icon';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { MediaItemSheet } from '@/components/MediaItemSheet';
import type { MediaItemSheetAction } from '@/components/MediaItemSheet';
import type { MediaBrowserNode } from '@/types';
import type { HaMediaBrowserProps } from './HaMediaBrowser.types';

const NUM_COLUMNS = 3;

export const HaMediaBrowser = ({
  entityId,
  hassBaseUrl,
}: HaMediaBrowserProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();

  const { items, history, loading, browse, goBack, goToRoot, goToIndex, playItem } =
    useMediaBrowser(entityId);

  const [filter, setFilter] = useState('');

  // Reset filter when navigating
  const historyKey = `${entityId}/${history.map(h => h.mediaContentId).join('/')}`;
  const [prevHistoryKey, setPrevHistoryKey] = useState(historyKey);
  if (historyKey !== prevHistoryKey) {
    setPrevHistoryKey(historyKey);
    setFilter('');
  }

  // Categorise items: tracks render as list rows, others as grid tiles
  const { trackItems, gridItems } = useMemo(() => {
    const isDeep = history.length > 0;
    const filtered =
      filter === ''
        ? items
        : items.filter(i => i.title.toLowerCase().includes(filter.toLowerCase()));

    const tracks: MediaBrowserNode[] = [];
    const grid: MediaBrowserNode[] = [];

    for (const item of filtered) {
      const isTrack =
        (item.mediaContentType === 'tracks' || item.mediaClass === 'track') &&
        item.mediaContentType !== 'favorite';
      if (isTrack && isDeep) {
        tracks.push(item);
      } else {
        grid.push(item);
      }
    }
    return { trackItems: tracks, gridItems: grid };
  }, [items, filter, history.length]);

  const handleBrowse = (node: MediaBrowserNode) => {
    browse(node);
  };

  const buildActions = useCallback(
    (node: MediaBrowserNode): MediaItemSheetAction[] => {
      const result: MediaItemSheetAction[] = [];
      if (node.canPlay) {
        result.push({ label: 'Play', icon: 'play', onPress: () => playItem(node, 'play') });
        result.push({
          label: 'Replace queue',
          icon: 'playlist-play',
          onPress: () => playItem(node, 'replace'),
        });
        result.push({
          label: 'Play next',
          icon: 'playlist-music',
          onPress: () => playItem(node, 'next'),
        });
        result.push({
          label: 'Add to queue',
          icon: 'playlist-plus',
          onPress: () => playItem(node, 'add'),
        });
      }
      if (node.canExpand) {
        result.push({ label: 'Open', icon: 'folder-open', onPress: () => browse(node) });
      }
      return result;
    },
    [playItem, browse],
  );

  const needsSheet = (node: MediaBrowserNode): boolean => node.canPlay;

  const renderHeader = (): React.JSX.Element => (
    <View>
      {/* Navigation bar */}
      {history.length > 0 && (
        <View style={styles.navBar}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-left" size={20} color={theme.onSurface} />
          </Pressable>
          <Pressable onPress={goToRoot} style={styles.breadcrumbItem}>
            <Icon name="home" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
          {history.map((entry, idx) => (
            <React.Fragment key={`bc-${entry.mediaContentId}`}>
              <Text style={styles.breadcrumbSeparator}>/</Text>
              <Pressable onPress={() => goToIndex(idx)} style={styles.breadcrumbItem}>
                <Text
                  style={[
                    styles.breadcrumbText,
                    idx === history.length - 1 && styles.breadcrumbTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {entry.title}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Filter input (only when browsing inside a folder with many items) */}
      {history.length > 0 && items.length > 6 && (
        <View style={styles.filterContainer}>
          <Icon name="magnify" size={16} color={theme.onSurfaceVariant} />
          <TextInput
            style={styles.filterInput}
            placeholder="Filter items..."
            placeholderTextColor={theme.onSurfaceVariant}
            value={filter}
            onChangeText={setFilter}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {filter.length > 0 && (
            <Pressable onPress={() => setFilter('')}>
              <Icon name="close" size={16} color={theme.onSurfaceVariant} />
            </Pressable>
          )}
        </View>
      )}

      {/* Grid items rendered as header so tracks list below is flat */}
      {gridItems.length > 0 && (
        <View style={styles.grid}>
          {gridItems.map(node => {
            const artworkUrl = resolveArtworkUrl(node.thumbnail, hassBaseUrl);
            const fallbackIcon = iconForMediaClass(node.childrenMediaClass ?? node.mediaClass);
            if (!needsSheet(node)) {
              return (
                <View key={node.mediaContentId} style={styles.gridCell}>
                  <MediaGridItem
                    title={node.title}
                    artworkUrl={artworkUrl}
                    fallbackIcon={fallbackIcon}
                    onPress={() => handleBrowse(node)}
                  />
                </View>
              );
            }
            return (
              <View key={node.mediaContentId} style={styles.gridCell}>
                <MediaItemSheet
                  artworkUrl={artworkUrl}
                  title={node.title}
                  actions={buildActions(node)}
                  renderTrigger={onOpen => (
                    <MediaGridItem
                      title={node.title}
                      artworkUrl={artworkUrl}
                      fallbackIcon={fallbackIcon}
                      onPress={onOpen}
                    />
                  )}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  // ─── Empty / loading states ──────────────────────────────────────────────

  const renderEmpty = (): React.JSX.Element | null => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No media items available.</Text>
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <FlatList
      data={trackItems}
      keyExtractor={item => item.mediaContentId}
      ListHeaderComponent={renderHeader()}
      ListEmptyComponent={gridItems.length === 0 ? renderEmpty() : undefined}
      renderItem={({ item }) => {
        const artworkUrl = resolveArtworkUrl(item.thumbnail, hassBaseUrl);
        const fallbackIcon = iconForMediaClass(item.mediaClass);
        if (!needsSheet(item)) {
          return (
            <MediaTrackItem
              title={item.title}
              artworkUrl={artworkUrl}
              fallbackIcon={fallbackIcon}
              onPress={() => handleBrowse(item)}
              showChevron={item.canExpand}
            />
          );
        }
        return (
          <MediaItemSheet
            artworkUrl={artworkUrl}
            title={item.title}
            actions={buildActions(item)}
            renderTrigger={onOpen => (
              <MediaTrackItem
                title={item.title}
                artworkUrl={artworkUrl}
                fallbackIcon={fallbackIcon}
                onPress={onOpen}
              />
            )}
          />
        );
      }}
      contentContainerStyle={styles.listContent}
    />
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  listContent: {
    paddingBottom: 24,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.outlineVariant,
  },
  breadcrumbItem: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    flexShrink: 1,
  },
  breadcrumbSeparator: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
  },
  breadcrumbText: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
  },
  breadcrumbTextActive: {
    color: theme.onSurface,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHigh,
    gap: 8,
  },
  filterInput: {
    flex: 1,
    fontSize: 14,
    color: theme.onSurface,
    padding: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  gridCell: {
    width: `${100 / NUM_COLUMNS}%` as unknown as number,
    padding: 4,
  },
  centered: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.onSurfaceVariant,
    fontSize: 14,
  },
}));
