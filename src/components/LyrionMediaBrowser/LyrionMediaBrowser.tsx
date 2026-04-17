import { useFocusEffect, useNavigation } from '@react-navigation/core';
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  type ImageStyle,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { SearchField } from '@/components/SearchField';
import { Button, ButtonIcon, ButtonText } from '@/components/Button';
import { MediaArtwork } from '@/components/MediaArtwork';
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
  onNavDepthChange,
}: LyrionMediaBrowserProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const navigation = useNavigation();

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

  // Report nav depth to the parent so it can reclaim headerRight at root.
  // Declared before the header effect so it fires first in the same commit.
  useLayoutEffect(() => {
    onNavDepthChange?.(navHistory.length);
  }, [navHistory.length, onNavDepthChange]);

  useLayoutEffect(() => {
    if (navHistory.length === 0) {
      navigation.setOptions({
        headerLeft: undefined,
        headerTitle: undefined,
        headerTitleAlign: undefined,
      });
      return;
    }

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
          <Pressable onPress={goHome} style={styles.headerBreadcrumbHomeItem}>
            <Icon name="home" size={20} color={theme.onSurfaceVariant} />
          </Pressable>
          {navHistory.map((entry, idx) => (
            <React.Fragment key={`bc-${idx}-${entry.id}`}>
              <Text style={styles.headerBreadcrumbSeparator}>/</Text>
              <Pressable onPress={() => goToIndex(idx)} style={styles.headerBreadcrumbItem}>
                <Text
                  style={[
                    styles.headerBreadcrumbText,
                    idx === navHistory.length - 1 && styles.headerBreadcrumbTextActive,
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
      headerRight: currentHeaderMenuActions.length > 0
        ? () => {
            const currentEntry = navHistory[navHistory.length - 1];
            const artworkUrl = currentEntry?.thumbnail;
            return (
              <MediaItemSheet
                title={currentEntry?.title ?? ''}
                artworkUrl={artworkUrl}
                actions={currentHeaderMenuActions}
                renderTrigger={onOpen => (
                  <Button
                    variant="surface"
                    size="sm"
                    shape="chip"
                    onPress={onOpen}
                    style={styles.headerPlayButton}
                  >
                    {artworkUrl
                      ? <MediaArtwork uri={artworkUrl} style={styles.headerPlayButtonArtwork as ImageStyle} />
                      : <ButtonIcon name="play" />
                    }
                    <ButtonText>{t('lyrionBrowser.action.play')}</ButtonText>
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
  }, [navigation, navHistory, currentHeaderMenuActions, goBack, goHome, goToIndex, theme, styles]);

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
                  <ButtonIcon name="chevron-right" style={styles.categoryButtonChevron} />
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
        {isSearchable && (
          <SearchField
            value={currentFilter}
            onChangeText={setCurrentFilter}
            placeholder={t('lyrionBrowser.searchPlaceholder')}
            style={styles.filterField}
          />
        )}
      </View>
    ),
    [styles, currentFilter, isSearchable, setCurrentFilter, setChunkSize, renderHeader],
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
  },
  headerPlayButtonArtwork: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  filterField: {
    marginTop: 12,
    marginBottom: 4,
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
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  categoryButtonChevron: {
    marginLeft: 'auto' as unknown as number,
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
