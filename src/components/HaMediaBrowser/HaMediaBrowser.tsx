import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, useMediaBrowser } from '@/hooks';
import { createUseStyles, iconForMediaClass, resolveArtworkUrl } from '@/utils';
import { Icon } from '@/components/Icon';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import type { MediaBrowserEntry, MediaBrowserNode } from '@/types';
import type { HaMediaBrowserProps } from './HaMediaBrowser.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const NUM_COLUMNS = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveEntries(
  entityId: string,
  mediaBrowserEntries?: MediaBrowserEntry[],
): MediaBrowserEntry[] {
  if (mediaBrowserEntries && mediaBrowserEntries.length > 0) {
    return mediaBrowserEntries;
  }
  return [{ entity_id: entityId }];
}

// ─── Component ───────────────────────────────────────────────────────────────

export const HaMediaBrowser = ({
  entityId,
  hassBaseUrl,
  mediaBrowserEntries,
}: HaMediaBrowserProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();

  const entries = useMemo(
    () => resolveEntries(entityId, mediaBrowserEntries),
    [entityId, mediaBrowserEntries],
  );
  const hasMultipleEntries = entries.length > 1;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeEntry = entries[selectedIndex] ?? entries[0];

  const { items, history, loading, browse, goBack, goToRoot, goToIndex, playItem } =
    useMediaBrowser(activeEntry.entity_id);

  const [filter, setFilter] = useState('');

  // Reset filter when navigating
  const historyKey = `${activeEntry.entity_id}/${history.map(h => h.mediaContentId).join('/')}`;
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

  const handleSelectEntry = (idx: number) => {
    if (idx === selectedIndex) return;
    setSelectedIndex(idx);
    setFilter('');
  };

  // ─── Header: entry picker + breadcrumbs + filter ─────────────────────────

  const renderHeader = (): React.JSX.Element => (
    <View>
      {/* Entry selector chips */}
      {hasMultipleEntries && history.length === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.entryChipsContainer}
        >
          {entries.map((entry, idx) => (
            <Pressable
              key={entry.entity_id}
              style={[styles.entryChip, idx === selectedIndex && styles.entryChipActive]}
              onPress={() => handleSelectEntry(idx)}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.entryChipText,
                  idx === selectedIndex && styles.entryChipTextActive,
                ]}
                numberOfLines={1}
              >
                {entry.name ?? entry.entity_id}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Navigation bar */}
      {history.length > 0 && (
        <View style={styles.navBar}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
            <Icon name="arrow-back" size={20} color={theme.onSurface} />
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
          <Icon name="search" size={16} color={theme.onSurfaceVariant} />
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
          {gridItems.map(node => (
            <View key={node.mediaContentId} style={styles.gridCell}>
              <MediaGridItem
                title={node.title}
                artworkUrl={resolveArtworkUrl(node.thumbnail, hassBaseUrl)}
                fallbackIcon={iconForMediaClass(node.childrenMediaClass ?? node.mediaClass)}
                onPress={() => (node.canExpand ? handleBrowse(node) : playItem(node))}
              />
            </View>
          ))}
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
      renderItem={({ item }) => (
        <MediaTrackItem
          title={item.title}
          artworkUrl={resolveArtworkUrl(item.thumbnail, hassBaseUrl)}
          fallbackIcon={iconForMediaClass(item.mediaClass)}
          onPress={() => (item.canExpand ? handleBrowse(item) : playItem(item))}
          onPlay={item.canPlay ? () => playItem(item) : undefined}
          showChevron={item.canExpand}
        />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  listContent: {
    paddingBottom: 24,
  },
  entryChipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  entryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  entryChipActive: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primary,
  },
  entryChipText: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
  },
  entryChipTextActive: {
    color: theme.onPrimaryContainer,
    fontWeight: '600',
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
