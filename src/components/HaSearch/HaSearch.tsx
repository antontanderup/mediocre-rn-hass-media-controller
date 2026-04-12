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
import { useFocusEffect } from '@react-navigation/core';
import { useHaSearch, useHaptics, useTheme } from '@/hooks';
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

  const renderGridHeader = (items: HaMediaItem[]): React.JSX.Element | null => {
    const grid = items.filter(i => i.media_class !== 'track');
    if (grid.length === 0) return null;
    return (
      <View style={styles.grid}>
        {grid.map(item => {
          const artworkUrl = resolveArtworkUrl(item.thumbnail, hassBaseUrl);
          const fallbackIcon = iconForMediaClass(item.media_class);
          return (
            <View key={item.media_content_id} style={styles.gridCell}>
              <MediaItemSheet
                artworkUrl={artworkUrl}
                title={item.title}
                actions={buildActions(item)}
                renderTrigger={onOpen => (
                  <MediaGridItem
                    title={item.title}
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
        renderItem={({ item }) => {
          const artworkUrl = resolveArtworkUrl(item.thumbnail, hassBaseUrl);
          const fallbackIcon = iconForMediaClass(item.media_class);
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
