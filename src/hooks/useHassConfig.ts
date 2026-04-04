import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import type { HassConfig } from '@/types';

const STORAGE_KEY = 'hass_config';

export interface HassConfigState {
  config: HassConfig | null;
  isLoaded: boolean;
  saveConfig: (c: HassConfig) => Promise<void>;
}

export const useHassConfig = (): HassConfigState => {
  const [config, setConfig] = useState<HassConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          const parsed = JSON.parse(stored) as HassConfig;
          setConfig(parsed);
        }
      })
      .catch(() => {
        // storage failure is non-fatal — proceed with null config
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const saveConfig = useCallback(async (c: HassConfig): Promise<void> => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(c));
    setConfig(c);
  }, []);

  return { config, isLoaded, saveConfig };
};
