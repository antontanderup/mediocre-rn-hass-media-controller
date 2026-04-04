import { useThemeContext } from '@/context';
import type { AppTheme } from '@/types';

export const useTheme = (): AppTheme => {
  const { theme } = useThemeContext();
  return theme;
};
