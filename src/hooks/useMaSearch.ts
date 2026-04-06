import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHassContext } from '@/context';
import type { MaEnqueueMode, MaFilterType, MaMediaItem, MaSearchResults } from '@/types';
import { useHassMessagePromise } from './useHassMessagePromise';

type ConfigEntry = {
  entry_id: string;
  domain: string;
  state: string;
};

export type UseMaSearchResult = {
  results: MaSearchResults;
  isSearching: boolean;
  error: string | null;
  playItem: (item: MaMediaItem, enqueue: MaEnqueueMode) => void;
};

export const useMaSearch = (
  query: string,
  filter: MaFilterType,
  maEntityId: string,
): UseMaSearchResult => {
  const { callService, sendMessage } = useHassContext();
  const [configEntryId, setConfigEntryId] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Fetch the MA config entry ID once on mount. This message returns a plain
  // array (not wrapped in a `response` key), so we use sendMessage directly.
  useEffect(() => {
    if (!maEntityId) return;
    setConfigError(null);
    setConfigEntryId(null);
    sendMessage<ConfigEntry[]>({ type: 'config/config_entries/entry' })
      .then(entries => {
        const maEntry = entries.find(
          e => e.domain === 'music_assistant' && e.state === 'loaded',
        );
        if (maEntry) {
          setConfigEntryId(maEntry.entry_id);
        } else {
          setConfigError('Music Assistant integration not found or not loaded');
        }
      })
      .catch(() => {
        setConfigError('Failed to fetch Music Assistant config');
      });
  }, [maEntityId, sendMessage]);

  // Build search message — null until config entry is known or query is too short
  const searchMessage = useMemo(() => {
    if (!configEntryId || query.trim().length < 2) return null;
    return {
      type: 'call_service',
      domain: 'music_assistant',
      service: 'search',
      service_data: {
        name: query,
        config_entry_id: configEntryId,
        ...(filter !== 'all' && { media_type: filter }),
      },
      return_response: true,
    };
  }, [query, filter, configEntryId]);

  const {
    data: searchData,
    loading: isSearching,
    error: searchError,
  } = useHassMessagePromise<MaSearchResults>(searchMessage, { staleTime: 120000 });

  const playItem = useCallback(
    (item: MaMediaItem, enqueue: MaEnqueueMode) => {
      callService('music_assistant', 'play_media', {
        media_id: item.uri,
        enqueue_mode: enqueue,
      });
    },
    [callService],
  );

  const results = useMemo<MaSearchResults>(
    () => (searchData as MaSearchResults | null) ?? {},
    [searchData],
  );

  return useMemo(
    () => ({
      results,
      isSearching,
      error: searchError ?? configError,
      playItem,
    }),
    [results, isSearching, searchError, configError, playItem],
  );
};
