import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHassContext } from '@/context';
import type { HaEnqueueMode, HaFilterConfig, HaFilterType, HaMediaItem } from '@/types';
import { HA_FILTER_DEFAULTS } from '@/utils';
import { useHassMessagePromise } from './useHassMessagePromise';

type HaSearchApiResponse = { [entityId: string]: { result: HaMediaItem[] } };

export type UseHaSearchResult = {
  results: HaMediaItem[];
  isSearching: boolean;
  error: string | null;
  isAvailable: boolean;
  filterConfig: HaFilterConfig[];
  playItem: (item: HaMediaItem, entityId: string, enqueue: HaEnqueueMode) => void;
};

export const useHaSearch = (
  query: string,
  filter: HaFilterType,
  entityId: string,
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
      isSearching,
      error: searchError,
      isAvailable,
      filterConfig: resolvedFilterConfig,
      playItem,
    }),
    [results, isSearching, searchError, isAvailable, resolvedFilterConfig, playItem],
  );
};
