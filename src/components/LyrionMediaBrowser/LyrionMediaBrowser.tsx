import { useFocusEffect } from '@react-navigation/core';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { Button, ButtonIcon, ButtonText } from '@/components/Button';
import { MediaGridItem } from '@/components/MediaGridItem';
import { MediaTrackItem } from '@/components/MediaTrackItem';
import { MediaItemSheet } from '@/components/MediaItemSheet';
import type { LyrionMediaBrowserProps } from './LyrionMediaBrowser.types';
import { CATEGORIES } from './constants';
import { type BrowserRow, useLyrionMediaBrowserData } from './useLyrionMediaBrowserData';
import type { LyrionBrowserItem } from './types';

function getItemIcon(item: LyrionBrowserItem): IconName | null {
  if (item.thumbnail) return null;
  if (item.type === 'category') {
    return (CATEGORIES.find(c => c.id === item.id)?.icon ?? 'folder') as IconName;
  }
  const iconMap: Partial<Record<LyrionBrowserItem['type'], IconName>> = {
    artist: 'account-music',
    album: 'album',
    track: 'music-note',
    genre: 'music-box-multiple',
    playlist: 'playlist-music',
    app: 'application',
  };
  return iconMap[item.type] ?? ('music' as IconName);
}

export const LyrionMediaBrowser = ({
  entityId,
  renderHeader,
}: LyrionMediaBrowserProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();

  const {
    navHistory,
    currentFilter,
    setCurrentFilter,
    isSearchable,
    isShowingCategories,
    items,
    hasNoArtwork,
    loading,
    error,
    hasMore,
    loadMore,
    chunkSize,
    setChunkSize,
    goBack,
    goToIndex,
    goHome,
    currentHeaderMenuActions,
    filteredItems,
  } = useLyrionMediaBrowserData({ entity_id: entityId });

  useFocusEffect(
    useCallback(() => {
      if (navHistory.length === 0) return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [navHistory.length, goBack]),
  );

  const keyExtractor = useCallback((item: BrowserRow, index: number): string => {
    if (!Array.isArray(item)) return `section-${item.categoryId}-${index}`;
    if (item.length === 0) return `empty-${index}`;
    return `row-${item[0].id}-${index}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: BrowserRow }): React.JSX.Element | null => {
      if (!Array.isArray(item)) {
        return (
          <Pressable
            onPress={item.onClick}
            style={({ pressed }) => [styles.sectionHeader, pressed && styles.sectionHeaderPressed]}
          >
            <Text style={styles.sectionHeaderText}>{item.sectionTitle}</Text>
            <Icon name="chevron-right" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
        );
      }

      if (item.length === 0) return null;

      const firstItem = item[0];

      if (firstItem.type === 'category' && isShowingCategories) {
        return (
          <View style={styles.categoryRow}>
            {item.map(mediaItem => {
              const icon = getItemIcon(mediaItem) ?? ('music' as IconName);
              return (
                <Button
                  key={mediaItem.id + navHistory.length}
                  variant="surface"
                  onPress={mediaItem.onClick ?? (() => {})}
                  style={styles.categoryButton}
                >
                  <ButtonIcon name={icon} />
                  <ButtonText>{mediaItem.title}</ButtonText>
                </Button>
              );
            })}
          </View>
        );
      }

      if (hasNoArtwork || firstItem.type === 'track') {
        return (
          <>
            {item.map(mediaItem => {
              const fallback = getItemIcon(mediaItem) ?? ('music-note' as IconName);
              if (!mediaItem.can_play && mediaItem.can_expand) {
                return (
                  <MediaTrackItem
                    key={mediaItem.id + navHistory.length}
                    title={mediaItem.title}
                    subtitle={mediaItem.subtitle}
                    artworkUrl={mediaItem.thumbnail}
                    fallbackIcon={fallback}
                    onPress={mediaItem.onClick ?? (() => {})}
                    showChevron
                  />
                );
              }
              if (!mediaItem.menuItems?.length) {
                return (
                  <MediaTrackItem
                    key={mediaItem.id + navHistory.length}
                    title={mediaItem.title}
                    subtitle={mediaItem.subtitle}
                    artworkUrl={mediaItem.thumbnail}
                    fallbackIcon={fallback}
                    onPress={mediaItem.onClick ?? (() => {})}
                  />
                );
              }
              return (
                <MediaItemSheet
                  key={mediaItem.id + navHistory.length}
                  artworkUrl={mediaItem.thumbnail}
                  title={mediaItem.title}
                  artist={mediaItem.subtitle}
                  actions={mediaItem.menuItems}
                  renderTrigger={onOpen => (
                    <MediaTrackItem
                      title={mediaItem.title}
                      subtitle={mediaItem.subtitle}
                      artworkUrl={mediaItem.thumbnail}
                      fallbackIcon={fallback}
                      onPress={onOpen}
                    />
                  )}
                />
              );
            })}
          </>
        );
      }

      return (
        <View style={styles.gridRow}>
          {item.map(mediaItem => {
            const fallback = getItemIcon(mediaItem) ?? ('folder' as IconName);
            const cellStyle = [styles.gridCell, { width: `${100 / chunkSize}%` as unknown as number }];
            if (!mediaItem.can_play || (mediaItem.can_expand && isShowingCategories)) {
              return (
                <View key={mediaItem.id + navHistory.length} style={cellStyle}>
                  <MediaGridItem
                    title={mediaItem.title}
                    subtitle={mediaItem.subtitle}
                    artworkUrl={mediaItem.thumbnail}
                    fallbackIcon={fallback}
                    onPress={mediaItem.onClick ?? (() => {})}
                  />
                </View>
              );
            }
            return (
              <View key={mediaItem.id + navHistory.length} style={cellStyle}>
                <MediaItemSheet
                  artworkUrl={mediaItem.thumbnail}
                  title={mediaItem.title}
                  actions={mediaItem.menuItems ?? []}
                  renderTrigger={onOpen => (
                    <MediaGridItem
                      title={mediaItem.title}
                      subtitle={mediaItem.subtitle}
                      artworkUrl={mediaItem.thumbnail}
                      fallbackIcon={fallback}
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
    [styles, theme, isShowingCategories, hasNoArtwork, navHistory.length, chunkSize],
  );

  const listHeader = useMemo(
    () => (
      <View
        onLayout={e => {
          const { width } = e.nativeEvent.layout;
          if (width > 800) setChunkSize(6);
          else if (width > 390) setChunkSize(4);
          else setChunkSize(3);
        }}
      >
        {renderHeader?.()}
        {navHistory.length > 0 && (
          <View style={styles.navBar}>
            <Pressable
              onPress={goBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={t('haMediaBrowser.goBack')}
            >
              <Icon name="arrow-left" size={20} color={theme.onSurface} />
            </Pressable>
            <View style={styles.breadcrumbs}>
              <Pressable onPress={goHome} style={styles.breadcrumbItem}>
                <Icon name="home" size={14} color={theme.onSurfaceVariant} />
              </Pressable>
              {navHistory.map((entry, idx) => (
                <React.Fragment key={`bc-${idx}-${entry.id}`}>
                  <Text style={styles.breadcrumbSeparator}>/</Text>
                  <Pressable onPress={() => goToIndex(idx)} style={styles.breadcrumbItem}>
                    <Text
                      style={[
                        styles.breadcrumbText,
                        idx === navHistory.length - 1 && styles.breadcrumbTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
            {currentHeaderMenuActions.length > 0 && (
              <MediaItemSheet
                title={navHistory[navHistory.length - 1]?.title ?? ''}
                actions={currentHeaderMenuActions}
                renderTrigger={onOpen => (
                  <Pressable onPress={onOpen} style={styles.playButton}>
                    <Icon name="play" size={16} color={theme.onPrimary} />
                    <Text style={styles.playButtonText}>{t('lyrionBrowser.action.play')}</Text>
                  </Pressable>
                )}
              />
            )}
          </View>
        )}
        {isSearchable && (
          <View style={styles.filterContainer}>
            <Icon name="magnify" size={16} color={theme.onSurfaceVariant} />
            <TextInput
              style={styles.filterInput}
              placeholder={t('lyrionBrowser.searchPlaceholder')}
              placeholderTextColor={theme.onSurfaceVariant}
              value={currentFilter}
              onChangeText={setCurrentFilter}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {currentFilter.length > 0 && (
              <Pressable onPress={() => setCurrentFilter('')}>
                <Icon name="close" size={16} color={theme.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        )}
      </View>
    ),
    [
      styles, theme, navHistory, currentFilter, isSearchable, currentHeaderMenuActions,
      goBack, goHome, goToIndex, setCurrentFilter, setChunkSize, renderHeader,
    ],
  );

  const renderEmpty = (): React.JSX.Element | null => {
    if (loading) {
      return <View style={styles.centered}><ActivityIndicator color={theme.primary} /></View>;
    }
    if (error) {
      return <View style={styles.centered}><Text style={styles.emptyText}>{t('lyrionBrowser.errorText')}</Text></View>;
    }
    if (filteredItems.length === 0) {
      return <View style={styles.centered}><Text style={styles.emptyText}>{t('lyrionBrowser.emptyText')}</Text></View>;
    }
    return null;
  };

  return (
    <FlatList
      data={items}
      keyExtractor={keyExtractor}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={items.length === 0 ? renderEmpty() : undefined}
      renderItem={renderItem}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContent}
    />
  );
};

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
  backButton: {
    padding: 4,
  },
  breadcrumbs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  breadcrumbItem: {
    paddingHorizontal: 2,
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
  homeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.onSurface,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.primary,
  },
  playButtonText: {
    color: theme.onPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 4,
  },
  sectionHeaderPressed: {
    opacity: 0.7,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.onSurface,
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  gridCell: {
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
