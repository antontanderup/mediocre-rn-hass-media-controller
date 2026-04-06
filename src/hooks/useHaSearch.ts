import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHassContext } from '@/context';
import type { HaEnqueueMode, HaFilterConfig, HaFilterType, HaMediaItem } from '@/types';
import { HA_FILTER_DEFAULTS } from '@/utils';
import { useHassMessagePromise } from './useHassMessagePromise';

type HaSearchApiResponse = { [entityId: string]: { result: HaMediaItem[] } };
type HaBrowseApiResponse = { [entityId: string]: { children: HaMediaItem[] } };

export type UseHaSearchResult = {
  results: HaMediaItem[];
  favorites: HaMediaItem[];
  isSearching: boolean;
  isFetchingFavorites: boolean;
  error: string | null;
  isAvailable: boolean;
  filterConfig: HaFilterConfig[];
  playItem: (item: HaMediaItem, entityId: string, enqueue: HaEnqueueMode) => void;
};

export const useHaSearch = (
  query: string,
  filter: HaFilterType,
  entityId: string,
  showFavorites = true,
  filterConfig?: HaFilterConfig[],
): UseHaSearchResult => {
  const { callService } = useHassContext();
  const [isAvailable, setIsAvailable] = useState(true);
  // Track if we've ever gotten a successful result so we don't flip isAvailable on transient errors
  const hasSucceeded = useRef(false);

  const resolvedFilterConfig = filterConfig ?? HA_FILTER_DEFAULTS;

  // Build the search message — null when query is too short
  const searchMessage = useMemo(() => {
    if (!entityId || query.trim().length < 2) return null;
    return {
      type: 'call_service',
      domain: 'media_player',
      service: 'search_media',
      service_data: {
        search_query: query,
        entity_id: entityId,
        ...(filter !== 'all' && { media_content_type: filter }),
      },
      return_response: true,
    };
  }, [query, filter, entityId]);

  const {
    data: searchData,
    loading: isSearching,
    error: searchError,
  } = useHassMessagePromise<HaSearchApiResponse>(searchMessage);

  // Favorites: only fetch when query is empty and showFavorites is on
  const favoritesMessage = useMemo(() => {
    if (!entityId || !showFavorites || query.trim().length > 0) return null;
    return {
      type: 'call_service',
      domain: 'media_player',
      service: 'browse_media',
      service_data: {
        entity_id: entityId,
        media_content_type: 'favorites',
      },
      return_response: true,
    };
  }, [entityId, showFavorites, query]);

  const { data: favoritesData, loading: isFetchingFavorites } =
    useHassMessagePromise<HaBrowseApiResponse>(favoritesMessage, { staleTime: 60000 });

  // Track availability based on errors
  useEffect(() => {
    if (searchData) {
      hasSucceeded.current = true;
    }
    if (searchError && !hasSucceeded.current) {
      setIsAvailable(false);
    }
  }, [searchData, searchError]);

  const results = useMemo<HaMediaItem[]>(
    () => (searchData as HaSearchApiResponse | null)?.[entityId]?.result ?? [],
    [searchData, entityId],
  );

  const favorites = useMemo<HaMediaItem[]>(
    () =>
      ((favoritesData as HaBrowseApiResponse | null)?.[entityId]?.children ?? []).filter(
        item => item.can_play,
      ),
    [favoritesData, entityId],
  );

  const playItem = useCallback(
    (item: HaMediaItem, targetEntityId: string, enqueue: HaEnqueueMode) => {
      callService(
        'media_player',
        'play_media',
        {
          media_content_type: item.media_content_type,
          media_content_id: item.media_content_id,
          enqueue,
        },
        { entity_id: targetEntityId },
      );
    },
    [callService],
  );

  return useMemo(
    () => ({
      results,
      favorites,
      isSearching,
      isFetchingFavorites,
      error: searchError,
      isAvailable,
      filterConfig: resolvedFilterConfig,
      playItem,
    }),
    [
      results,
      favorites,
      isSearching,
      isFetchingFavorites,
      searchError,
      isAvailable,
      resolvedFilterConfig,
      playItem,
    ],
  );
};
