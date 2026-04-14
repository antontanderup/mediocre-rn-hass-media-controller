import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHassMessagePromise } from '@/hooks';
import { useHassContext } from '@/context';
import type { SqueezeboxServerStatusResponse, HaEnqueueMode } from '@/types';
import type { MediaItemSheetAction } from '@/components/MediaItemSheet';
import { t } from '@/localization';
import type { LyrionBrowserItem, LyrionCategoryType } from './types';
import {
  type BrowserHistoryEntry,
  CATEGORIES,
  CATEGORY_COMMANDS,
  HOME_ENTRY,
  HOME_APPS_PARAMS,
  HOME_FAVORITES_PARAMS,
  HOME_NEW_MUSIC_PARAMS,
} from './constants';
import { type BrowseContext, buildBrowseParams, buildPlaylistSearchTerm } from './utils';
import { useLyrionBrowse } from './useLyrionBrowse';
import { useLyrionGlobalSearch } from './useLyrionGlobalSearch';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export type BrowserRow =
  | LyrionBrowserItem[]
  | { sectionTitle: string; categoryId: LyrionCategoryType; onClick?: () => void };

export const useLyrionMediaBrowserData = ({ entity_id }: { entity_id: string }) => {
  const { callService } = useHassContext();

  const [history, setHistory] = useState<BrowserHistoryEntry[]>([HOME_ENTRY]);
  const navHistory = history.slice(1);
  const committedFilter = history[history.length - 1].filter;
  const [chunkSize, setChunkSize] = useState(3);
  const [startIndex, setStartIndex] = useState(0);
  const [accumulatedItems, setAccumulatedItems] = useState<LyrionBrowserItem[]>([]);
  const [appSearchItemId, setAppSearchItemId] = useState<string | undefined>();

  const navKey = navHistory.map(h => h.id).join('/');

  const [inputValue, setInputValue] = useState(committedFilter);
  const debouncedInputValue = useDebounce(inputValue, 350);

  const commitFilter = useCallback((filter: string) => {
    setHistory(prev => {
      if (prev[prev.length - 1].filter === filter) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], filter };
      return updated;
    });
  }, []);

  useEffect(() => {
    commitFilter(debouncedInputValue);
  }, [debouncedInputValue, commitFilter]);

  // Reset input when navigating to a new page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setInputValue(history[history.length - 1].filter); }, [navKey]);

  const { data: serverData } = useHassMessagePromise<SqueezeboxServerStatusResponse>(
    {
      type: 'call_service',
      domain: 'lyrion_cli',
      service: 'query',
      service_data: { command: 'serverstatus', entity_id, parameters: ['-'] },
      return_response: true,
    },
    { staleTime: 600000 },
  );

  const isHomeScreen = navHistory.length === 0;
  const isGlobalSearch = isHomeScreen && !!committedFilter;

  const {
    items: globalSearchItems,
    loading: globalSearchLoading,
    totalCount: globalSearchTotalCount,
  } = useLyrionGlobalSearch({
    entity_id,
    searchTerm: committedFilter,
    serverData,
    enabled: isGlobalSearch,
  });

  const isShowingHomePreview = isHomeScreen && !committedFilter;

  const { items: homeNewMusicBrowseItems } = useLyrionBrowse({
    entity_id, command: 'albums', parameters: HOME_NEW_MUSIC_PARAMS, serverData,
    enabled: isShowingHomePreview,
  });
  const { items: homeFavoritesBrowseItems } = useLyrionBrowse({
    entity_id, command: 'favorites', parameters: HOME_FAVORITES_PARAMS, serverData,
    enabled: isShowingHomePreview,
  });
  const { items: homeAppsBrowseItems } = useLyrionBrowse({
    entity_id, command: 'apps', parameters: HOME_APPS_PARAMS, serverData,
    enabled: isShowingHomePreview,
  });

  const { command, parameters } = useMemo(() => {
    if (navHistory.length === 0) return { command: '', parameters: [] };
    const current = navHistory[navHistory.length - 1];
    const context: BrowseContext = {
      depth: navHistory.length,
      current,
      appCommand: navHistory.find(h => h.type === 'app')?.command,
      appSearchItemId,
      genreId: navHistory.find(h => h.type === 'genre')?.id,
      artistId: navHistory.find(h => h.type === 'artist')?.id,
      albumId: navHistory.find(h => h.type === 'album')?.id,
      playlistId: navHistory.find(h => h.type === 'playlist')?.id,
    };
    return buildBrowseParams(context, startIndex, committedFilter);
    // navKey is a stable string proxy for navHistory
  }, [navKey, startIndex, committedFilter, appSearchItemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    items: rawItems,
    loading: browseLoading,
    totalCount: browseTotalCount,
    searchItemId,
    error: browseError,
  } = useLyrionBrowse({
    entity_id, command, parameters, serverData,
    enabled: !isGlobalSearch && (navHistory.length > 0 || !!committedFilter),
  });

  useEffect(() => {
    const appEntry = navHistory.find(h => h.type === 'app');
    if (!appEntry) { setAppSearchItemId(undefined); }
    else if (searchItemId) { setAppSearchItemId(searchItemId); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey, searchItemId]);

  useEffect(() => {
    setStartIndex(0);
    setAccumulatedItems([]);
  }, [navKey, committedFilter]);

  useEffect(() => {
    if (isGlobalSearch) return;
    if (rawItems.length > 0) {
      if (startIndex === 0) { setAccumulatedItems(rawItems); }
      else { setAccumulatedItems(prev => [...prev, ...rawItems]); }
    }
  }, [rawItems, startIndex, isGlobalSearch]);

  const loading = isGlobalSearch ? globalSearchLoading : browseLoading;
  const totalCount = isGlobalSearch ? globalSearchTotalCount : browseTotalCount;

  const categoryItems: LyrionBrowserItem[] = useMemo(
    () => CATEGORIES.map(cat => ({
      id: cat.id, title: cat.title, type: 'category' as const, can_play: false, can_expand: true,
    })),
    [],
  );

  const isShowingCategories = isHomeScreen && !committedFilter;

  const displayItems = isShowingCategories
    ? categoryItems
    : isGlobalSearch
      ? globalSearchItems
      : startIndex === 0
        ? rawItems
        : accumulatedItems;

  const isSearchable = useMemo(() => {
    if (navHistory.length === 0) return true;
    const current = navHistory[navHistory.length - 1];
    if (current.command === 'favorites' || current.id === 'apps') return false;
    const appEntry = navHistory.find(h => h.type === 'app');
    if (appEntry && !appSearchItemId && !searchItemId) return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKey, searchItemId, appSearchItemId]);

  const hasMore =
    !isGlobalSearch && accumulatedItems.length < totalCount && !isShowingCategories;

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setStartIndex(accumulatedItems.length);
  }, [loading, hasMore, accumulatedItems.length]);

  const playItem = useCallback(
    (item: LyrionBrowserItem, enqueue?: HaEnqueueMode) => {
      let action = 'loadtracks';
      if (enqueue === 'next') action = 'inserttracks';
      else if (enqueue === 'add') action = 'addtracks';

      const appEntry = navHistory.find(h => h.type === 'app');
      const isFavorite = item.isFavorite || navHistory.find(h => h.command === 'favorites');
      try {
        if (appEntry) {
          const appAction = action === 'loadtracks' ? 'play' : action === 'inserttracks' ? 'insert' : 'add';
          callService('squeezebox', 'call_method', {
            entity_id, command: appEntry.command,
            parameters: ['playlist', appAction, `item_id:${item.id}`],
          });
        } else if (isFavorite) {
          const appAction = action === 'loadtracks' ? 'play' : action === 'inserttracks' ? 'insert' : 'add';
          callService('squeezebox', 'call_method', {
            entity_id, command: 'favorites',
            parameters: ['playlist', appAction, `item_id:${item.id}`],
          });
        } else {
          callService('squeezebox', 'call_method', {
            entity_id, command: 'playlist',
            parameters: [action, buildPlaylistSearchTerm(item)],
          });
        }
      } catch {
        // Service call errors are non-fatal from the UI perspective
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entity_id, navKey, callService],
  );

  const onItemClick = useCallback(
    (item: LyrionBrowserItem) => {
      if (loading) return;

      if (item.type === 'category') {
        const categoryId = item.id as LyrionCategoryType;
        const mapping = CATEGORY_COMMANDS[categoryId];
        setHistory(prev => [prev[0], {
          id: categoryId, title: item.title,
          command: mapping?.command ?? categoryId,
          parameters: mapping?.parameters ?? [],
          type: item.type, filter: '',
        }]);
        return;
      }

      if (item.type === 'app') {
        setHistory(prev => [...prev, {
          id: item.id, title: item.title, command: item.id,
          parameters: [], type: 'app' as const, filter: '',
        }]);
        return;
      }

      const appEntry = navHistory.find(h => h.type === 'app');
      if (appEntry && item.can_expand) {
        setHistory(prev => [...prev, {
          id: item.id, title: item.title, command: appEntry.command,
          parameters: [], type: item.type, filter: '',
        }]);
        return;
      }

      if (item.can_expand) {
        let nextCommand = '';
        switch (item.type) {
          case 'genre': nextCommand = 'artists'; break;
          case 'artist': nextCommand = 'albums'; break;
          case 'album': case 'playlist': nextCommand = 'titles'; break;
          default: return;
        }
        setHistory(prev => [...prev, {
          id: item.id, title: item.title, command: nextCommand,
          parameters: [], type: item.type, filter: '',
        }]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, navKey],
  );

  const getItemMenuActions = useCallback(
    (item: LyrionBrowserItem, excludeExpandOptions = false): MediaItemSheetAction[] => {
      const actions: MediaItemSheetAction[] = [];
      if (item.can_play) {
        actions.push({ label: t('lyrionBrowser.action.play'), icon: 'play', onPress: () => playItem(item) });
        actions.push({ label: t('lyrionBrowser.action.playNext'), icon: 'playlist-music', onPress: () => playItem(item, 'next') });
        actions.push({ label: t('lyrionBrowser.action.replaceQueue'), icon: 'playlist-play', onPress: () => playItem(item, 'replace') });
        actions.push({ label: t('lyrionBrowser.action.addToQueue'), icon: 'playlist-plus', onPress: () => playItem(item, 'add') });
      }
      if (item.can_expand && !excludeExpandOptions) {
        actions.push({ label: t('lyrionBrowser.action.browse'), icon: 'folder-outline', onPress: () => onItemClick(item) });
      }
      return actions;
    },
    [playItem, onItemClick],
  );

  const enrichedDisplayItems = useMemo(
    () => displayItems.map(item => ({
      ...item,
      onClick: () => onItemClick(item),
      menuItems: getItemMenuActions(item),
    })),
    [displayItems, onItemClick, getItemMenuActions],
  );

  // navigateToSearchCategory is defined after this memo but is stable (empty deps),
  // so the closures captured here will resolve correctly when called.
  const { items, hasNoArtwork } = useMemo(() => {
    let noArtwork = true;
    const result: BrowserRow[] = [];

    enrichedDisplayItems.forEach(item => { if (typeof item.thumbnail === 'string') noArtwork = false; });
    if (isShowingHomePreview) {
      [...homeNewMusicBrowseItems, ...homeFavoritesBrowseItems, ...homeAppsBrowseItems]
        .forEach(item => { if (typeof item.thumbnail === 'string') noArtwork = false; });
    }

    if (isGlobalSearch) {
      const sections = [
        { title: t('lyrionBrowser.section.artists'), categoryId: 'artists' as LyrionCategoryType, items: enrichedDisplayItems.filter(i => i.type === 'artist'), isTrack: false },
        { title: t('lyrionBrowser.section.albums'), categoryId: 'albums' as LyrionCategoryType, items: enrichedDisplayItems.filter(i => i.type === 'album'), isTrack: false },
        { title: t('lyrionBrowser.section.tracks'), categoryId: 'tracks' as LyrionCategoryType, items: enrichedDisplayItems.filter(i => i.type === 'track'), isTrack: true },
        { title: t('lyrionBrowser.section.playlists'), categoryId: 'playlists' as LyrionCategoryType, items: enrichedDisplayItems.filter(i => i.type === 'playlist'), isTrack: false },
      ];
      const maxPerSection = chunkSize * 2;
      for (const section of sections) {
        if (section.items.length === 0) continue;
        result.push({ sectionTitle: section.title, categoryId: section.categoryId, onClick: () => navigateToSearchCategory(section.categoryId) });
        const limited = section.items.slice(0, maxPerSection);
        if (section.isTrack) { limited.forEach(item => result.push([item])); }
        else { for (let i = 0; i < limited.length; i += chunkSize) result.push(limited.slice(i, i + chunkSize)); }
      }
    } else {
      const grouped: Record<'track' | 'expandable', LyrionBrowserItem[]> = { track: [], expandable: [] };
      enrichedDisplayItems.forEach(item => {
        grouped[item.type === 'track' && !isShowingCategories ? 'track' : 'expandable'].push(item);
      });
      Object.entries(grouped).forEach(([mediaType, groupItems]) => {
        if (mediaType === 'track' && !isShowingCategories) { groupItems.forEach(item => result.push([item])); }
        else { for (let i = 0; i < groupItems.length; i += chunkSize) result.push(groupItems.slice(i, i + chunkSize)); }
      });

      if (isShowingHomePreview) {
        const maxRowItems = chunkSize * 2;
        const addSection = (
          sectionTitle: string,
          categoryId: LyrionCategoryType,
          sectionItems: LyrionBrowserItem[],
        ) => {
          if (sectionItems.length === 0) return;
          result.push({ sectionTitle, categoryId, onClick: () => navigateToSearchCategory(categoryId) });
          const limited = sectionItems.slice(0, maxRowItems).map(item => ({
            ...item, onClick: () => onItemClick(item), menuItems: getItemMenuActions(item),
          }));
          for (let i = 0; i < limited.length; i += chunkSize) result.push(limited.slice(i, i + chunkSize));
        };
        addSection(t('lyrionBrowser.section.newMusic'), 'newmusic', homeNewMusicBrowseItems);
        addSection(t('lyrionBrowser.section.favorites'), 'favorites', homeFavoritesBrowseItems);
        addSection(t('lyrionBrowser.section.apps'), 'apps', homeAppsBrowseItems);
      }
    }

    return { items: result, hasNoArtwork: noArtwork };
    // navigateToSearchCategory, onItemClick, getItemMenuActions are stable useCallbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedDisplayItems, chunkSize, isShowingCategories, isGlobalSearch, isShowingHomePreview, homeNewMusicBrowseItems, homeFavoritesBrowseItems, homeAppsBrowseItems]);

  const goBack = useCallback(() => {
    if (loading || navHistory.length === 0) return;
    setHistory(prev => prev.slice(0, -1));
  }, [navHistory.length, loading]);

  const goToIndex = useCallback((navIndex: number) => {
    if (loading) return;
    setHistory(prev => prev.slice(0, navIndex + 2));
  }, [loading]);

  const goHome = useCallback(() => {
    setInputValue('');
    setHistory(prev => [prev[0]]);
  }, []);

  const currentHeaderMenuActions: MediaItemSheetAction[] = useMemo(() => {
    const current = navHistory[navHistory.length - 1];
    return current
      ? getItemMenuActions({
          id: current.id, title: current.title, type: current.type,
          can_play: current.type !== 'category' && current.type !== 'app',
          can_expand: false,
        }, true)
      : [];
  }, [navKey, getItemMenuActions]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigateToSearchCategory = useCallback((categoryId: LyrionCategoryType) => {
    const cat = CATEGORIES.find(c => c.id === categoryId)!;
    const mapping = CATEGORY_COMMANDS[categoryId];
    setHistory(prev => [prev[0], {
      id: categoryId, title: cat.title,
      command: mapping?.command ?? categoryId,
      parameters: mapping?.parameters ?? [],
      type: 'category' as const,
      filter: prev[prev.length - 1].filter,
    }]);
  }, []);

  return {
    navHistory,
    currentFilter: inputValue,
    setCurrentFilter: setInputValue,
    isSearchable,
    isShowingCategories,
    items,
    hasNoArtwork,
    loading,
    error: isGlobalSearch ? null : browseError,
    hasMore,
    loadMore,
    chunkSize,
    setChunkSize,
    goBack,
    goToIndex,
    goHome,
    currentHeaderMenuActions,
    filteredItems: enrichedDisplayItems,
  };
};
