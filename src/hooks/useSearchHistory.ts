import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'search_history';
const MAX_QUERIES = 50;

export interface SearchHistoryState {
  queries: string[];
  addQuery: (query: string) => void;
}

export const useSearchHistory = (): SearchHistoryState => {
  const [queries, setQueries] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            setQueries(parsed as string[]);
          }
        }
      })
      .catch(() => {
        // storage failure is non-fatal
      });
  }, []);

  const addQuery = useCallback((query: string): void => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setQueries(prev => {
      const next = [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, MAX_QUERIES);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { queries, addQuery };
};
