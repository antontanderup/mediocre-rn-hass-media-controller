import { useFocusEffect, useNavigation } from '@react-navigation/core';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, type ImageStyle, Pressable, Text, View } from 'react-native';
import { useTheme, useMediaBrowser } from '@/hooks';
import { createUseStyles, iconForMediaClass, resolveArtworkUrl } from '@/utils';
import { t } from '@/localization';
import { Icon } from '@/components/Icon';
import { SearchField } from '@/components/SearchField';
import { Button, ButtonIcon, ButtonText } from '@/components/Button';
import { MediaArtwork } from '@/components/MediaArtwork';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { MediaItemSheet } from '@/components/MediaItemSheet';
import type { MediaItemSheetAction } from '@/components/MediaItemSheet';
import type { MediaBrowserNode } from '@/types';
import type { HaMediaBrowserProps } from './HaMediaBrowser.types';

const NUM_COLUMNS = 3;

// ─── List row union ───────────────────────────────────────────────────────────

type GridRow = { kind: 'grid-row'; id: string; cols: MediaBrowserNode[] };
type TrackRow = { kind: 'track'; node: MediaBrowserNode };
type ListRow = GridRow | TrackRow;

// ─── Component ───────────────────────────────────────────────────────────────

export const HaMediaBrowser = ({
  entityId,
  hassBaseUrl,
  onNavDepthChange,
}: HaMediaBrowserProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();

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

  // Override hardware back button when inside a subfolder
  useFocusEffect(
    useCallback(() => {
      if (history.length === 0) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [history.length, goBack]),
  );

  const buildActions = useCallback(
    (node: MediaBrowserNode): MediaItemSheetAction[] => {
      const result: MediaItemSheetAction[] = [];
      if (node.canPlay) {
        result.push({ label: t('haMediaBrowser.action.play'), icon: 'play', onPress: () => playItem(node, 'play') });
        result.push({
          label: t('haMediaBrowser.action.replaceQueue'),
          icon: 'playlist-play',
          onPress: () => playItem(node, 'replace'),
        });
        result.push({
          label: t('haMediaBrowser.action.playNext'),
          icon: 'playlist-music',
          onPress: () => playItem(node, 'next'),
        });
        result.push({
          label: t('haMediaBrowser.action.addToQueue'),
          icon: 'playlist-plus',
          onPress: () => playItem(node, 'add'),
        });
      }
      if (node.canExpand) {
        result.push({ label: t('haMediaBrowser.action.open'), icon: 'folder-open', onPress: () => browse(node) });
      }
      return result;
    },
    [playItem, browse],
  );

  useLayoutEffect(() => {
    onNavDepthChange?.(history.length);
  }, [history.length, onNavDepthChange]);

  useLayoutEffect(() => {
    if (history.length === 0) {
      navigation.setOptions({
        headerLeft: undefined,
        headerTitle: undefined,
        headerTitleAlign: undefined,
        headerRight: undefined,
      });
      return;
    }

    const currentEntry = history[history.length - 1];
    const playActions = buildActions({ ...currentEntry, canExpand: false });

    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={goBack}
          style={styles.headerBackButton}
          accessibilityRole="button"
          accessibilityLabel={t('haMediaBrowser.goBack')}
        >
          <Icon name="arrow-left" size={20} color={theme.onSurface} />
        </Pressable>
      ),
      headerTitle: () => (
        <View style={styles.headerBreadcrumbs}>
          <Pressable onPress={goToRoot} style={styles.headerBreadcrumbHomeItem}>
            <Icon name="home" size={20} color={theme.onSurfaceVariant} />
          </Pressable>
          {history.map((entry, idx) => (
            <React.Fragment key={`bc-${entry.mediaContentId}`}>
              <Text style={styles.headerBreadcrumbSeparator}>/</Text>
              <Pressable onPress={() => goToIndex(idx)} style={styles.headerBreadcrumbItem}>
                <Text
                  style={[
                    styles.headerBreadcrumbText,
                    idx === history.length - 1 && styles.headerBreadcrumbTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {entry.title}
                </Text>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      ),
      headerTitleAlign: 'left',
      headerRight: playActions.length > 0
        ? () => {
            const artworkUrl = resolveArtworkUrl(currentEntry.thumbnail, hassBaseUrl);
            return (
              <MediaItemSheet
                title={currentEntry.title}
                artworkUrl={currentEntry.thumbnail}
                actions={playActions}
                renderTrigger={onOpen => (
                  <Button
                    variant="surface"
                    size="sm"
                    onPress={onOpen}
                    style={styles.headerPlayButton}
                  >
                    {artworkUrl
                      ? <MediaArtwork uri={artworkUrl} style={styles.headerPlayButtonArtwork as ImageStyle} />
                      : <ButtonIcon name="play" />
                    }
                    <ButtonText>{t('haMediaBrowser.action.play')}</ButtonText>
                    <ButtonIcon name="chevron-down" />
                  </Button>
                )}
              />
            );
          }
        : undefined,
    });

    return () => {
      navigation.setOptions({
        headerLeft: undefined,
        headerTitle: undefined,
        headerTitleAlign: undefined,
        headerRight: undefined,
      });
    };
  }, [navigation, history, hassBaseUrl, goBack, goToRoot, goToIndex, theme, styles, buildActions]);

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

  // Group grid items into rows of NUM_COLUMNS so FlatList can virtualize them.
  // Track items follow grid rows in the same data array.
  const listData = useMemo((): ListRow[] => {
    const rows: ListRow[] = [];
    for (let i = 0; i < gridItems.length; i += NUM_COLUMNS) {
      const cols = gridItems.slice(i, i + NUM_COLUMNS);
      rows.push({ kind: 'grid-row', id: cols[0].mediaContentId, cols });
    }
    for (const node of trackItems) {
      rows.push({ kind: 'track', node });
    }
    return rows;
  }, [gridItems, trackItems]);

  const handleBrowse = useCallback(
    (node: MediaBrowserNode) => {
      browse(node);
    },
    [browse],
  );

  // ─── Header: filter only (nav bar lives in the native navigation header) ──

  const listHeader = useMemo(
    () => (
      <View>
        {history.length > 0 && items.length > 6 && (
          <SearchField
            value={filter}
            onChangeText={setFilter}
            placeholder={t('haMediaBrowser.filterItems')}
            style={styles.filterField}
          />
        )}
      </View>
    ),
    [styles, history.length, items.length, filter],
  );

  // ─── Row renderers ────────────────────────────────────────────────────────

  const keyExtractor = useCallback(
    (item: ListRow) =>
      item.kind === 'grid-row' ? `grid-row-${item.id}` : item.node.mediaContentId,
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ListRow; index: number }): React.JSX.Element => {
      if (item.kind === 'grid-row') {
        return (
          <View style={[styles.gridRow, index === 0 && styles.gridRowFirst]}>
            {item.cols.map(node => {
              const artworkUrl = resolveArtworkUrl(node.thumbnail, hassBaseUrl);
              const fallbackIcon = iconForMediaClass(node.childrenMediaClass ?? node.mediaClass);
              if (!node.canPlay) {
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
        );
      }

      const { node } = item;
      const artworkUrl = resolveArtworkUrl(node.thumbnail, hassBaseUrl);
      const fallbackIcon = iconForMediaClass(node.mediaClass);
      if (!node.canPlay) {
        return (
          <MediaTrackItem
            title={node.title}
            artworkUrl={artworkUrl}
            fallbackIcon={fallbackIcon}
            onPress={() => handleBrowse(node)}
            showChevron={node.canExpand}
          />
        );
      }
      return (
        <MediaItemSheet
          artworkUrl={artworkUrl}
          title={node.title}
          actions={buildActions(node)}
          renderTrigger={onOpen => (
            <MediaTrackItem
              title={node.title}
              artworkUrl={artworkUrl}
              fallbackIcon={fallbackIcon}
              onPress={onOpen}
            />
          )}
        />
      );
    },
    [styles, hassBaseUrl, handleBrowse, buildActions],
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
        <Text style={styles.emptyText}>{t('haMediaBrowser.noItems')}</Text>
      </View>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <FlatList
      data={listData}
      keyExtractor={keyExtractor}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listData.length === 0 ? renderEmpty() : undefined}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  listContent: {
    paddingBottom: 24,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerBreadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  headerBreadcrumbHomeItem: {
    paddingHorizontal: 2,
  },
  headerBreadcrumbItem: {
    paddingHorizontal: 2,
    flexShrink: 1,
  },
  headerBreadcrumbSeparator: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
  },
  headerBreadcrumbText: {
    color: theme.onSurfaceVariant,
    fontSize: 13,
  },
  headerBreadcrumbTextActive: {
    color: theme.onSurface,
    fontWeight: '600',
  },
  headerPlayButton: {
    marginLeft: 8,
    marginRight: 8,
    flexShrink: 0,
  },
  headerPlayButtonArtwork: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  filterField: {
    marginTop: 12,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  gridRowFirst: {
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
