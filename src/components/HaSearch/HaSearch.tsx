import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { useHaSearch, useHaptics, useSearchHistory, useTheme } from '@/hooks';
import { createUseStyles, iconForMediaClass, resolveArtworkUrl } from '@/utils';
import { t } from '@/localization';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { MediaItemSheet } from '@/components/MediaItemSheet';
import type { MediaItemSheetAction } from '@/components/MediaItemSheet';
import { Icon } from '@/components/Icon';
import type { HaMediaItem } from '@/types';
import type { HaSearchProps } from './HaSearch.types';

const DEBOUNCE_MS = 600;
const GRID_COLUMNS = 3;

type SectionItem =
  | { kind: 'track'; item: HaMediaItem }
  | { kind: 'gridRow'; items: HaMediaItem[] };

type ResultSection = {
  title: string;
  filterType: string | null;
  data: SectionItem[];
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export const HaSearch = ({
  entityId,
  hassBaseUrl,
  filterConfig,
}: HaSearchProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const inputRef = useRef<TextInput>(null);

  // Query state with debounce
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search history
  const { queries: searchHistory, addQuery } = useSearchHistory();
  const historyApplied = useRef(false);

  // Prefill with the latest query once history loads
  useEffect(() => {
    if (!historyApplied.current && searchHistory.length > 0) {
      historyApplied.current = true;
      const latest = searchHistory[0];
      setRawQuery(latest);
      setDebouncedQuery(latest);
    }
  }, [searchHistory]);

  // Save to history whenever a valid debounced query fires
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      addQuery(debouncedQuery);
    }
  }, [debouncedQuery, addQuery]);

  // Autofocus when screen gains focus and field is empty
  useFocusEffect(
    useCallback(() => {
      if (rawQuery === '') {
        inputRef.current?.focus();
      }
    }, [rawQuery]),
  );

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

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const haSearch = useHaSearch(debouncedQuery, activeFilter, entityId, filterConfig);
  const hasQuery = debouncedQuery.trim().length >= 2;

  const buildActions = useCallback(
    (item: HaMediaItem): MediaItemSheetAction[] => [
      { label: t('haSearch.enqueue.play'), icon: 'play', onPress: () => haSearch.playItem(item, entityId, 'play') },
      { label: t('haSearch.enqueue.replaceQueue'), icon: 'playlist-play', onPress: () => haSearch.playItem(item, entityId, 'replace') },
      { label: t('haSearch.enqueue.addNext'), icon: 'playlist-music', onPress: () => haSearch.playItem(item, entityId, 'next') },
      { label: t('haSearch.enqueue.addToQueue'), icon: 'playlist-plus', onPress: () => haSearch.playItem(item, entityId, 'add') },
    ],
    [haSearch, entityId],
  );

  // Group results by media_content_type into SectionList sections.
  // Section headers are only shown when there are multiple content types.
  const sections = useMemo((): ResultSection[] => {
    const grouped: Record<string, HaMediaItem[]> = {};
    for (const item of haSearch.results) {
      if (!grouped[item.media_content_type]) grouped[item.media_content_type] = [];
      grouped[item.media_content_type].push(item);
    }
    const groupEntries = Object.entries(grouped);
    const isMultiSection = groupEntries.length > 1;
    return groupEntries.map(([mediaContentType, items]) => {
      // Match against filter config: exact type match or singular form (e.g. 'tracks' → 'track')
      const filterCfg = haSearch.filterConfig.find(
        f => f.type === mediaContentType || f.type.slice(0, -1) === mediaContentType,
      );
      const title =
        filterCfg?.name ??
        mediaContentType.charAt(0).toUpperCase() + mediaContentType.slice(1);
      const isTrackSection = items[0]?.media_class === 'track';
      const data: SectionItem[] = isTrackSection
        ? items.map(item => ({ kind: 'track' as const, item }))
        : chunkArray(items, GRID_COLUMNS).map(rowItems => ({
            kind: 'gridRow' as const,
            items: rowItems,
          }));
      return {
        title: isMultiSection ? title : '',
        filterType: isMultiSection && filterCfg ? filterCfg.type : null,
        data,
      };
    });
  }, [haSearch.results, haSearch.filterConfig]);

  const renderSectionItem = useCallback(
    ({ item }: { item: SectionItem }) => {
      if (item.kind === 'track') {
        const artworkUrl = resolveArtworkUrl(item.item.thumbnail, hassBaseUrl);
        const fallbackIcon = iconForMediaClass(item.item.media_class);
        return (
          <MediaItemSheet
            artworkUrl={artworkUrl}
            title={item.item.title}
            actions={buildActions(item.item)}
            renderTrigger={onOpen => (
              <MediaTrackItem
                title={item.item.title}
                artworkUrl={artworkUrl}
                fallbackIcon={fallbackIcon}
                onPress={onOpen}
              />
            )}
          />
        );
      }
      // gridRow: render items side-by-side in a flex row
      return (
        <View style={styles.grid}>
          {item.items.map(mediaItem => {
            const artworkUrl = resolveArtworkUrl(mediaItem.thumbnail, hassBaseUrl);
            const fallbackIcon = iconForMediaClass(mediaItem.media_class);
            return (
              <View key={mediaItem.media_content_id} style={styles.gridCell}>
                <MediaItemSheet
                  artworkUrl={artworkUrl}
                  title={mediaItem.title}
                  actions={buildActions(mediaItem)}
                  renderTrigger={onOpen => (
                    <MediaGridItem
                      title={mediaItem.title}
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
    },
    [hassBaseUrl, buildActions, styles],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ResultSection }) => {
      const { title, filterType } = section;
      if (!title) return null;
      if (!filterType) {
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        );
      }
      return (
        <Pressable
          style={({ pressed }) => [styles.sectionHeader, pressed && styles.btnPressed]}
          onPress={() => {
            haptics.light();
            setActiveFilter(filterType);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('haSearch.filterBy', { name: title })}
        >
          <Text style={[styles.sectionHeaderText, styles.sectionHeaderLink]}>{title}</Text>
          <Icon name="chevron-right" size={16} color={theme.primary} />
        </Pressable>
      );
    },
    [styles, theme, haptics],
  );

  // Render helpers
  const renderHeader = (): React.JSX.Element => (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <Icon name="magnify" size={18} color={theme.onSurfaceVariant} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={rawQuery}
          onChangeText={handleQueryChange}
          placeholder={t('haSearch.placeholder')}
          placeholderTextColor={theme.onSurfaceVariant}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {rawQuery.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.clearBtn, pressed && styles.btnPressed]}
            onPress={() => { haptics.light(); handleClear(); }}
            accessibilityRole="button"
            accessibilityLabel={t('haSearch.clearSearch')}
          >
            <Icon name="close" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {haSearch.filterConfig.map(f => {
          const isActive = f.type === activeFilter;
          return (
            <Pressable
              key={f.type}
              style={({ pressed }) => [styles.filterChip, isActive && styles.filterChipSelected, pressed && styles.filterChipPressed]}
              onPress={() => { haptics.selection(); setActiveFilter(f.type); }}
              accessibilityRole="button"
              accessibilityLabel={t('haSearch.filterBy', { name: f.name })}
            >
              {f.icon && (
                <Icon
                  name={f.icon}
                  size={14}
                  color={isActive ? theme.onSecondaryContainer : theme.onSurfaceVariant}
                />
              )}
              <Text
                style={[styles.filterChipText, isActive && styles.filterChipTextSelected]}
              >
                {f.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderContent = (): React.JSX.Element => {
    if (!haSearch.isAvailable) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('haSearch.notAvailable')}</Text>
        </View>
      );
    }

    if (haSearch.isSearching && hasQuery) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
        </View>
      );
    }

    if (!hasQuery) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('haSearch.typeToSearch')}</Text>
        </View>
      );
    }

    return (
      <SectionList<SectionItem, ResultSection>
        style={styles.list}
        sections={sections}
        keyExtractor={(item, index) =>
          item.kind === 'track'
            ? item.item.media_content_id
            : `row-${item.items[0]?.media_content_id ?? index}`
        }
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {t('haSearch.noResultsForQuery', { query: debouncedQuery })}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.onSurface,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  btnPressed: {
    opacity: 0.5,
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
