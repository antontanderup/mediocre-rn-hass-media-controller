import AsyncStorage from '@react-native-async-storage/async-storage';
import { type } from 'arktype';
import { useCallback, useEffect, useState } from 'react';
import type { AppConfig } from '@/types';

const STORAGE_KEY = 'app_config';

// ─── Validation schema ────────────────────────────────────────────────────────

const entrySchema = type({
  entity_id: 'string',
  'name?': 'string | null',
});

const mediaPlayerConfigSchema = type({
  entityId: 'string',
  'name?': 'string | null',
  'speakerGroupEntityId?': 'string | null',
  'canBeGrouped?': 'boolean | null',
  'maEntityId?': 'string | null',
  'maFavoriteButtonEntityId?': 'string | null',
  'lmsEntityId?': 'string | null',
  'searchEntries?': entrySchema.array(),
  'mediaBrowserEntries?': entrySchema.array(),
});

const appOptionsSchema = type({
  'useArtColors?': 'boolean',
  'playerIsActiveWhen?': '"playing" | "playing_or_paused"',
});

const appConfigSchema = type({
  mediaPlayers: mediaPlayerConfigSchema.array(),
  options: appOptionsSchema,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppConfigState {
  config: AppConfig | null;
  isLoaded: boolean;
  saveConfig: (config: AppConfig) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAppConfig = (): AppConfigState => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          const result = appConfigSchema(parsed);
          if (!(result instanceof type.errors)) {
            setConfig(result);
          }
        }
      })
      .catch(() => {
        // storage failure is non-fatal — proceed with null config
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const saveConfig = useCallback(async (c: AppConfig): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setConfig(c);
  }, []);

  return { config, isLoaded, saveConfig };
};
