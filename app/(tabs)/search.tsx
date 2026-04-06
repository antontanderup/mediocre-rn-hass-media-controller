import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SearchResultItem } from '@/components';
import {
  useHaSearch,
  useMaSearch,
  useSearchProvider,
  useTheme,
} from '@/hooks';
import type {
  HaEnqueueMode,
  HaMediaItem,
  MaEnqueueMode,
  MaMediaItem,
  MaSearchResults,
} from '@/types';
import { MA_SECTION_LABELS, MA_SECTION_ORDER } from '@/types';
import { MA_FILTER_DEFAULTS, createUseStyles } from '@/utils';

const DEBOUNCE_MS = 600;

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.onSurface,
    padding: 0,
  },
  clearBtn: {
    padding: 2,
  },
  clearBtnText: {
    fontSize: 14,
    color: theme.primary,
  },
  // Provider chips
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: theme.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  chipSelected: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
  },
  chipTextSelected: {
    color: theme.onPrimaryContainer,
    fontWeight: '600',
  },
  // Filter chips
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.surfaceVariant,
  },
  filterChipSelected: {
    backgroundColor: theme.secondaryContainer,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
  filterChipTextSelected: {
    color: theme.onSecondaryContainer,
    fontWeight: '600',
  },
  // Content
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.surfaceVariant,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: theme.outlineVariant,
    marginLeft: 72,
  },
  list: {
    flex: 1,
  },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haSubtitle(item: HaMediaItem): string {
  return item.media_class ?? '';
}

function maSubtitle(item: MaMediaItem): string {
  return [item.artist, item.album].filter(Boolean).join(' • ');
}

function maSections(
  results: MaSearchResults,
): { title: string; data: MaMediaItem[] }[] {
  return MA_SECTION_ORDER.flatMap((key: keyof MaSearchResults) => {
    const items = results[key];
    if (!items || items.length === 0) return [];
    return [{ title: MA_SECTION_LABELS[key] ?? key, data: items }];
  });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SearchTab(): React.JSX.Element {
  const { entityId } = useLocalSearchParams<{ entityId?: string }>();
  const theme = useTheme();
  const styles = useStyles();

  const safeEntityId = entityId ?? '';

  // ── Query state ──────────────────────────────────────────────────────────
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = useCallback((text: string) => {
    setRawQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), DEBOUNCE_MS);
  }, []);

  const handleClear = useCallback(() => {
    setRawQuery('');
    setDebouncedQuery('');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Provider selection ───────────────────────────────────────────────────
  const { providers, selected: selectedProvider, select: selectProvider } =
    useSearchProvider(safeEntityId);

  // Reset filters when provider changes
  const [haFilter, setHaFilter] = useState<string>('all');
  const [maFilter, setMaFilter] = useState<string>('all');
  const [haEnqueueMode] = useState<HaEnqueueMode>('play');
  const [maEnqueueMode] = useState<MaEnqueueMode>('play');

  // ── HA search ────────────────────────────────────────────────────────────
  const haEntityId =
    selectedProvider?.type === 'ha' ? selectedProvider.entityId : safeEntityId;
  const haSearch = useHaSearch(debouncedQuery, haFilter, haEntityId, true);

  // ── MA search ────────────────────────────────────────────────────────────
  const maEntityId =
    selectedProvider?.type === 'ma' ? selectedProvider.maEntityId : '';
  const maSearch = useMaSearch(debouncedQuery, maFilter as never, maEntityId);

  // ── Render helpers ───────────────────────────────────────────────────────
  const isMA = selectedProvider?.type === 'ma';
  const isSearching = isMA ? maSearch.isSearching : haSearch.isSearching;
  const hasQuery = debouncedQuery.trim().length >= 2;

  const renderProviderChips = () => {
    if (providers.length <= 1) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.providerRow}
        contentContainerStyle={{ gap: 8 }}
      >
        {providers.map(p => {
          const id = p.type === 'ha' ? p.entityId : p.maEntityId;
          const selId =
            selectedProvider?.type === 'ha'
              ? selectedProvider.entityId
              : selectedProvider?.maEntityId;
          const isActive = id === selId;
          return (
            <Pressable
              key={id}
              style={[styles.chip, isActive && styles.chipSelected]}
              onPress={() => selectProvider(p)}
              accessibilityRole="button"
              accessibilityLabel={`Search using ${p.name}`}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextSelected]}>
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  const renderFilterChips = () => {
    const filters = isMA ? MA_FILTER_DEFAULTS : haSearch.filterConfig;
    const activeFilter = isMA ? maFilter : haFilter;
    const setFilter = isMA ? setMaFilter : setHaFilter;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ gap: 6 }}
      >
        {filters.map(f => {
          const isActive = f.type === activeFilter;
          return (
            <Pressable
              key={f.type}
              style={[styles.filterChip, isActive && styles.filterChipSelected]}
              onPress={() => setFilter(f.type)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${f.name}`}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextSelected]}>
                {f.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  };

  // ── HA results / favorites ───────────────────────────────────────────────
  const renderHaContent = () => {
    if (!haSearch.isAvailable) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Search is not available for this player.</Text>
        </View>
      );
    }

    if (isSearching && !hasQuery) {
      return null;
    }

    if (isSearching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }

    // Show favorites when query is empty
    if (!hasQuery) {
      if (haSearch.isFetchingFavorites) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
          </View>
        );
      }
      if (haSearch.favorites.length === 0) {
        return (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Type to search.</Text>
          </View>
        );
      }
      return (
        <FlatList
          style={styles.list}
          data={haSearch.favorites}
          keyExtractor={(item: HaMediaItem) => item.media_content_id}
          renderItem={({ item }: { item: HaMediaItem }) => (
            <SearchResultItem
              title={item.title}
              subtitle={haSubtitle(item)}
              thumbnail={item.thumbnail}
              mediaClass={item.media_class}
              onPlay={() => haSearch.playItem(item, haEntityId, haEnqueueMode)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentInsetAdjustmentBehavior="automatic"
        />
      );
    }

    if (haSearch.results.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No results for "{debouncedQuery}".</Text>
        </View>
      );
    }

    return (
      <FlatList
        style={styles.list}
        data={haSearch.results}
        keyExtractor={(item: HaMediaItem) => item.media_content_id}
        renderItem={({ item }: { item: HaMediaItem }) => (
          <SearchResultItem
            title={item.title}
            subtitle={haSubtitle(item)}
            thumbnail={item.thumbnail}
            mediaClass={item.media_class}
            onPlay={() => haSearch.playItem(item, haEntityId, haEnqueueMode)}
            onEnqueue={
              item.can_play
                ? () => haSearch.playItem(item, haEntityId, 'add')
                : undefined
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  };

  // ── MA results ───────────────────────────────────────────────────────────
  const maSectionData = useMemo(() => maSections(maSearch.results), [maSearch.results]);

  const renderMaContent = () => {
    if (maSearch.error && !maSearch.isSearching) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{maSearch.error}</Text>
        </View>
      );
    }

    if (!hasQuery) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Type to search Music Assistant.</Text>
        </View>
      );
    }

    if (maSearch.isSearching) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }

    if (maSectionData.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No results for "{debouncedQuery}".</Text>
        </View>
      );
    }

    return (
      <SectionList
        style={styles.list}
        sections={maSectionData}
        keyExtractor={(item: MaMediaItem) => item.uri}
        renderSectionHeader={({ section }: { section: { title: string; data: MaMediaItem[] } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }: { item: MaMediaItem }) => (
          <SearchResultItem
            title={item.name}
            subtitle={maSubtitle(item)}
            thumbnail={item.image}
            mediaClass={item.media_type}
            onPlay={() => maSearch.playItem(item, maEnqueueMode)}
            onEnqueue={() => maSearch.playItem(item, 'add')}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  };

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={rawQuery}
            onChangeText={handleQueryChange}
            placeholder="Search…"
            placeholderTextColor={theme.onSurfaceVariant}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {rawQuery.length > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
          )}
        </View>
        {renderProviderChips()}
        {renderFilterChips()}
      </View>

      {isMA ? renderMaContent() : renderHaContent()}
    </View>
  );
}
