import { useCallback, useEffect, useState } from 'react';
import type { HassConfig } from '@/types';

// expo-secure-store has no web implementation; use localStorage as a fallback.

const STORAGE_KEY = 'hass_config';

export interface HassConfigState {
  config: HassConfig | null;
  isLoaded: boolean;
  saveConfig: (c: HassConfig) => Promise<void>;
  clearConfig: () => Promise<void>;
}

export const useHassConfig = (): HassConfigState => {
  const [config, setConfig] = useState<HassConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored) as HassConfig);
      }
    } catch {
      // non-fatal
    }
    setIsLoaded(true);
  }, []);

  const saveConfig = useCallback(async (c: HassConfig): Promise<void> => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setConfig(c);
  }, []);

  const clearConfig = useCallback(async (): Promise<void> => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(null);
  }, []);

  return { config, isLoaded, saveConfig, clearConfig };
};
