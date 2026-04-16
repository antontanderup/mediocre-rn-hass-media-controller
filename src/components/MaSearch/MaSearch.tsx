import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SearchField } from '@/components/SearchField';
import { useMaSearch, useMaFavorites, useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { MediaItemSheet } from '@/components/MediaItemSheet';
import { Icon } from '@/components/Icon';
import { BottomSheetSelect } from '@/components/BottomSheetSelect';
import { Button, ButtonIcon } from '@/components/Button';
import type { MediaItemSheetAction } from '@/components/MediaItemSheet';
import type { MaEnqueueMode, MaFilterType, MaMediaItem, MaSearchResults, MaTrackItem, MaAlbumItem } from '@/types';
import type { MaSearchProps } from './MaSearch.types';

const DEBOUNCE_MS = 600;
const GRID_COLUMNS = 3;

const MA_FILTERS: { type: MaFilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'track', label: 'Tracks' },
  { type: 'album', label: 'Albums' },
  { type: 'artist', label: 'Artists' },
  { type: 'playlist', label: 'Playlists' },
  { type: 'radio', label: 'Radio' },
  { type: 'audiobook', label: 'Audiobooks' },
  { type: 'podcast', label: 'Podcasts' },
];

const ENQUEUE_OPTIONS: { value: MaEnqueueMode; label: string; icon: 'play-circle' | 'playlist-remove' | 'playlist-play' | 'playlist-edit' | 'playlist-plus' }[] = [
  { value: 'play', label: 'Play', icon: 'play-circle' },
  { value: 'replace', label: 'Replace Queue', icon: 'playlist-remove' },
  { value: 'next', label: 'Add Next', icon: 'playlist-play' },
  { value: 'replace_next', label: 'Replace Next', icon: 'playlist-edit' },
  { value: 'add', label: 'Add to Queue', icon: 'playlist-plus' },
];

const ENQUEUE_ICON_MAP: Record<MaEnqueueMode, 'play-circle' | 'playlist-remove' | 'playlist-play' | 'playlist-edit' | 'playlist-plus'> = {
  play: 'play-circle',
  replace: 'playlist-remove',
  next: 'playlist-play',
  replace_next: 'playlist-edit',
  add: 'playlist-plus',
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

type SectionItem =
  | { kind: 'track'; item: MaMediaItem }
  | { kind: 'gridRow'; items: MaMediaItem[] };

type ResultSection = {
  title: string;
  filterType: MaFilterType | null;
  data: SectionItem[];
};

const RESULTS_KEY_ORDER: (keyof MaSearchResults)[] = [
  'tracks', 'albums', 'artists', 'playlists', 'radio', 'audiobooks', 'podcasts',
];

const RESULTS_KEY_LABEL: Record<string, string> = {
  tracks: 'Tracks', albums: 'Albums', artists: 'Artists',
  playlists: 'Playlists', radio: 'Radio', audiobooks: 'Audiobooks', podcasts: 'Podcasts',
};

const RESULTS_KEY_FILTER: Record<string, MaFilterType> = {
  tracks: 'track', albums: 'album', artists: 'artist',
  playlists: 'playlist', radio: 'radio', audiobooks: 'audiobook', podcasts: 'podcast',
};

function buildSections(results: MaSearchResults): ResultSection[] {
  const nonEmpty = RESULTS_KEY_ORDER.filter(k => (results[k]?.length ?? 0) > 0);
  const isMulti = nonEmpty.length > 1;
  return nonEmpty.map(key => {
    const items = results[key] ?? [];
    const label = RESULTS_KEY_LABEL[key] ?? key;
    const filterType = RESULTS_KEY_FILTER[key] as MaFilterType ?? null;
    const isTrack = items[0]?.media_type === 'track';
    const data: SectionItem[] = isTrack
      ? items.map(item => ({ kind: 'track' as const, item }))
      : chunkArray(items, GRID_COLUMNS).map(row => ({ kind: 'gridRow' as const, items: row }));
    return { title: isMulti ? label : '', filterType: isMulti ? filterType : null, data };
  });
}

function getArtistNames(item: MaMediaItem): string | undefined {
  if (item.media_type === 'track') {
    const track = item as MaTrackItem;
    return track.artists?.map(a => a.name).join(', ');
  }
  if (item.media_type === 'album') {
    const album = item as MaAlbumItem;
    return album.artists?.map(a => a.name).join(', ');
  }
  return undefined;
}

function getTrackArtwork(item: MaMediaItem): string | undefined {
  if (item.media_type === 'track') {
    const track = item as MaTrackItem;
    return (track.image ?? track.album?.image) ?? undefined;
  }
  return item.image ?? undefined;
}

export const MaSearch = ({ maEntityId }: MaSearchProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeFilter, setActiveFilter] = useState<MaFilterType>('all');
  const [enqueueMode, setEnqueueMode] = useState<MaEnqueueMode>('play');

  const handleQueryChange = useCallback((text: string) => {
    setRawQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (text === '') {
      setDebouncedQuery('');
    } else {
      debounceTimer.current = setTimeout(() => setDebouncedQuery(text), DEBOUNCE_MS);
    }
  }, []);

  const hasQuery = debouncedQuery.trim().length >= 2;

  const { results: searchResults, isSearching, playItem } = useMaSearch(
    debouncedQuery,
    activeFilter,
    maEntityId,
  );

  const { favorites } = useMaFavorites(activeFilter, !hasQuery);

  const sections = useMemo(
    () => buildSections(hasQuery ? searchResults : (favorites ?? {})),
    [hasQuery, searchResults, favorites],
  );

  const buildActions = useCallback(
    (item: MaMediaItem): MediaItemSheetAction[] =>
      ENQUEUE_OPTIONS.map(opt => ({
        label: t(`maSearch.enqueue.${opt.value}`),
        icon: opt.icon,
        onPress: () => playItem(item, enqueueMode),
      })),
    [playItem, enqueueMode],
  );

  const renderItem = useCallback(
    ({ item }: { item: SectionItem }) => {
      if (item.kind === 'track') {
        const artworkUrl = getTrackArtwork(item.item);
        const subtitle = getArtistNames(item.item);
        return (
          <MediaItemSheet
            artworkUrl={artworkUrl}
            title={item.item.name}
            actions={buildActions(item.item)}
            renderTrigger={onOpen => (
              <MediaTrackItem
                title={item.item.name}
                subtitle={subtitle}
                artworkUrl={artworkUrl}
                fallbackIcon="music-note"
                onPress={onOpen}
              />
            )}
          />
        );
      }
      return (
        <View style={styles.grid}>
          {item.items.map((mediaItem, idx) => {
            const artworkUrl = mediaItem.image ?? undefined;
            const subtitle = getArtistNames(mediaItem);
            return (
              <View key={mediaItem.uri ?? idx} style={styles.gridCell}>
                <MediaItemSheet
                  artworkUrl={artworkUrl}
                  title={mediaItem.name}
                  actions={buildActions(mediaItem)}
                  renderTrigger={onOpen => (
                    <MediaGridItem
                      title={mediaItem.name}
                      subtitle={subtitle}
                      artworkUrl={artworkUrl}
                      fallbackIcon="folder-music"
                      onPress={onOpen}
                    />
                  )}
                />
              </View>
            );
          })}
        </View>
      );
    },
    [buildActions, styles],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ResultSection }) => {
      if (!section.title) return null;
      if (!section.filterType) {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        );
      }
      return (
        <Pressable
          style={({ pressed }) => [styles.sectionHeader, pressed && styles.sectionHeaderPressed]}
          onPress={() => { haptics.light(); setActiveFilter(section.filterType!); }}
          accessibilityRole="button"
          accessibilityLabel={t('maSearch.filterBy', { name: section.title })}
        >
          <Text style={[styles.sectionHeaderText, styles.sectionHeaderLink]}>{section.title}</Text>
          <Icon name="chevron-right" size={16} color={theme.primary} />
        </Pressable>
      );
    },
    [styles, theme, haptics],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.inputRow}>
        <SearchField
          value={rawQuery}
          onChangeText={handleQueryChange}
          placeholder={t('maSearch.placeholder')}
          style={styles.searchField}
        />
        <BottomSheetSelect<MaEnqueueMode>
          title={t('maSearch.enqueueMode')}
          options={ENQUEUE_OPTIONS}
          value={enqueueMode}
          onChange={val => { haptics.selection(); setEnqueueMode(val); }}
          renderTrigger={onOpen => (
            <Button variant="ghost" size="sm" onPress={onOpen} accessibilityLabel={t('maSearch.changeEnqueueMode')}>
              <ButtonIcon name={ENQUEUE_ICON_MAP[enqueueMode]} />
            </Button>
          )}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {MA_FILTERS.map(f => {
          const isActive = f.type === activeFilter;
          return (
            <Pressable
              key={f.type}
              style={({ pressed }) => [
                styles.filterChip,
                isActive && styles.filterChipSelected,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => { haptics.selection(); setActiveFilter(f.type); }}
              accessibilityRole="button"
              accessibilityLabel={t('maSearch.filterBy', { name: f.label })}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextSelected]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (isSearching && hasQuery) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }

    return (
      <SectionList<SectionItem, ResultSection>
        style={styles.list}
        sections={sections}
        keyExtractor={(item, index) =>
          item.kind === 'track'
            ? item.item.uri
            : `row-${item.items[0]?.uri ?? index}`
        }
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {hasQuery
                ? t('maSearch.noResultsForQuery', { query: debouncedQuery })
                : t('maSearch.favoritesEmpty')}
            </Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchField: {
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: theme.surfaceVariant,
  },
  filterChipSelected: {
    backgroundColor: theme.secondaryContainer,
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
  filterChipTextSelected: {
    color: theme.onSecondaryContainer,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    gap: 2,
  },
  sectionHeaderPressed: {
    opacity: 0.5,
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.onSurfaceVariant,
  },
  sectionHeaderLink: {
    color: theme.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  gridCell: {
    width: `${100 / GRID_COLUMNS}%` as unknown as number,
    padding: 4,
  },
  list: {
    flex: 1,
  },
}));
