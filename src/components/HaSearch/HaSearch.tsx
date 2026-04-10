import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHaSearch, useHaptics, useTheme } from '@/hooks';
import { createUseStyles, iconForMediaClass, resolveArtworkUrl } from '@/utils';
import { t } from '@/localization';
import { BottomSheetSelect } from '@/components/BottomSheetSelect';
import type { BottomSheetSelectOption } from '@/components/BottomSheetSelect';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { Icon } from '@/components/Icon';
import type { HaEnqueueMode, HaMediaItem } from '@/types';
import type { HaSearchProps } from './HaSearch.types';

const DEBOUNCE_MS = 600;

const ENQUEUE_OPTIONS: BottomSheetSelectOption<HaEnqueueMode>[] = [
  { value: 'play', label: t('haSearch.enqueue.play'), icon: 'play-circle-outline' },
  { value: 'replace', label: t('haSearch.enqueue.replaceQueue'), icon: 'playlist-remove' },
  { value: 'next', label: t('haSearch.enqueue.addNext'), icon: 'playlist-play' },
  { value: 'add', label: t('haSearch.enqueue.addToQueue'), icon: 'playlist-plus' },
];

export const HaSearch = ({
  entityId,
  hassBaseUrl,
  showFavorites = true,
  filterConfig,
}: HaSearchProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  // Query state with debounce
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

  // Filter & enqueue state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [enqueueMode, setEnqueueMode] = useState<HaEnqueueMode>('replace');

  const haSearch = useHaSearch(debouncedQuery, activeFilter, entityId, showFavorites, filterConfig);
  const hasQuery = debouncedQuery.trim().length >= 2;

  const renderGridHeader = (items: HaMediaItem[]): React.JSX.Element | null => {
    const grid = items.filter(i => i.media_class !== 'track');
    if (grid.length === 0) return null;
    return (
      <View style={styles.grid}>
        {grid.map(item => (
          <View key={item.media_content_id} style={styles.gridCell}>
            <MediaGridItem
              title={item.title}
              artworkUrl={resolveArtworkUrl(item.thumbnail, hassBaseUrl)}
              fallbackIcon={iconForMediaClass(item.media_class)}
              onPress={() => haSearch.playItem(item, entityId, enqueueMode)}
            />
          </View>
        ))}
      </View>
    );
  };

  const renderItemList = (items: HaMediaItem[]): React.JSX.Element => {
    const tracks = items.filter(i => i.media_class === 'track');
    const hasGrid = items.some(i => i.media_class !== 'track');

    return (
      <FlatList
        style={styles.list}
        data={tracks}
        keyExtractor={item => item.media_content_id}
        ListHeaderComponent={hasGrid ? renderGridHeader(items) : undefined}
        ListEmptyComponent={
          !hasGrid ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('haSearch.noResults')}</Text>
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <MediaTrackItem
            title={item.title}
            artworkUrl={resolveArtworkUrl(item.thumbnail, hassBaseUrl)}
            fallbackIcon={iconForMediaClass(item.media_class)}
            onPlay={() => haSearch.playItem(item, entityId, enqueueMode)}
          />
        )}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  };

  // Render helpers
  const renderHeader = (): React.JSX.Element => (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <Icon name="magnify" size={18} color={theme.onSurfaceVariant} />
        <TextInput
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
        <BottomSheetSelect
          options={ENQUEUE_OPTIONS}
          value={enqueueMode}
          onChange={setEnqueueMode}
          title={t('haSearch.playbackMode')}
          renderTrigger={onOpen => (
            <Pressable
              style={({ pressed }) => [styles.enqueueBtn, pressed && styles.btnPressed]}
              onPress={onOpen}
              accessibilityRole="button"
              accessibilityLabel={t('haSearch.changeEnqueueMode')}
            >
              <Icon
                name={ENQUEUE_OPTIONS.find(o => o.value === enqueueMode)?.icon ?? 'play-circle-outline'}
                size={20}
                color={theme.primary}
              />
            </Pressable>
          )}
        />
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
            <Text style={styles.emptyText}>{t('haSearch.typeToSearch')}</Text>
          </View>
        );
      }
      return renderItemList(haSearch.favorites);
    }

    if (haSearch.results.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {t('haSearch.noResultsForQuery', { query: debouncedQuery })}
          </Text>
        </View>
      );
    }

    return renderItemList(haSearch.results);
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
  enqueueBtn: {
    padding: 4,
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
    width: `${100 / 3}%` as unknown as number,
    padding: 4,
  },
  list: {
    flex: 1,
  },
}));
