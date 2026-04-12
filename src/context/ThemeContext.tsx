import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import type { AppTheme } from '@/types';
import { buildTheme } from '@/utils';

const DEFAULT_SOURCE_COLOR = '#6750A4';
const STORAGE_KEY = 'source_color';

interface ThemeContextValue {
  theme: AppTheme;
  setSourceColor: (hex: string) => void;
  setArtworkColor: (hex: string | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps): React.JSX.Element => {
  const systemScheme = useColorScheme() ?? 'light';
  const [sourceColor, setSourceColorState] = useState(DEFAULT_SOURCE_COLOR);
  const [artworkColor, setArtworkColorState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored) {
          setSourceColorState(stored);
        }
      })
      .catch(() => {
        // fall back to default — storage failure is non-fatal
      });
  }, []);

  const setSourceColor = useCallback((hex: string) => {
    setSourceColorState(hex);
    AsyncStorage.setItem(STORAGE_KEY, hex).catch(() => {});
  }, []);

  const setArtworkColor = useCallback((hex: string | null) => {
    setArtworkColorState(hex);
  }, []);

  const theme = useMemo(
    () => buildTheme(artworkColor ?? sourceColor, systemScheme),
    [artworkColor, sourceColor, systemScheme],
  );

  const value = useMemo(
    () => ({ theme, setSourceColor, setArtworkColor }),
    [theme, setSourceColor, setArtworkColor],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
};
