import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHassContext } from '@/context';
import { getHassMessageWithCache } from '@/utils';
import type { MaFilterType, MaMediaItem, MaMediaType, MaSearchResults } from '@/types';

type ConfigEntry = {
  entry_id: string;
  domain: string;
  state: string;
};

const MEDIA_TYPE_TO_KEY: Record<MaMediaType, keyof MaSearchResults> = {
  artist: 'artists',
  album: 'albums',
  track: 'tracks',
  playlist: 'playlists',
  radio: 'radio',
  audiobook: 'audiobooks',
  podcast: 'podcasts',
};

const ALL_MEDIA_TYPES: MaMediaType[] = [
  'artist', 'album', 'track', 'playlist', 'radio', 'audiobook', 'podcast',
];

export type UseMaFavoritesResult = {
  favorites: MaSearchResults | null;
  loading: boolean;
};

export const useMaFavorites = (filter: MaFilterType, enabled: boolean): UseMaFavoritesResult => {
  const { sendMessage } = useHassContext();
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  const [configEntryId, setConfigEntryId] = useState<string | null>(null);
  const [results, setResults] = useState<MaSearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sendMessage<ConfigEntry[]>({ type: 'config_entries/get' })
      .then(entries => {
        const maEntry = entries.find(e => e.domain === 'music_assistant' && e.state === 'loaded');
        if (maEntry) setConfigEntryId(maEntry.entry_id);
      })
      .catch(() => {});
  }, [sendMessage]);

  const fetchFavorites = useCallback(
    async (configEntry: string, currentFilter: MaFilterType) => {
      const send = sendMessageRef.current;
      const limit = currentFilter === 'all' ? 8 : 20;
      const typesToFetch: MaMediaType[] =
        currentFilter === 'all' ? ALL_MEDIA_TYPES : [currentFilter];

      const newResults: MaSearchResults = {};

      await Promise.all(
        typesToFetch.map(async mediaType => {
          const message = {
            type: 'call_service',
            domain: 'music_assistant',
            service: 'get_library',
            service_data: {
              config_entry_id: configEntry,
              media_type: mediaType,
              favorite: true,
              limit,
            },
            return_response: true,
          };
          try {
            const res = await getHassMessageWithCache<{
              response: { items: MaMediaItem[] };
            }>(message, send, { staleTime: 120000 });
            newResults[MEDIA_TYPE_TO_KEY[mediaType]] = res.response?.items ?? [];
          } catch {
            // ignore per-type failures
          }
        }),
      );

      setResults(newResults);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (!configEntryId || !enabled) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetchFavorites(configEntryId, filter);
  }, [configEntryId, filter, enabled, fetchFavorites]);

  return useMemo(() => ({ favorites: results, loading }), [results, loading]);
};
