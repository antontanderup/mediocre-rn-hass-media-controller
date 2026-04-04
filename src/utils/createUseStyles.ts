import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/hooks';
import type { AppTheme } from '@/types';

/**
 * Factory that creates a typed `useStyles` hook bound to the current theme.
 *
 * Usage:
 * ```ts
 * const useStyles = createUseStyles(theme => ({
 *   container: { backgroundColor: theme.background },
 * }));
 *
 * // Inside a component:
 * const styles = useStyles();
 * ```
 *
 * The returned hook re-derives styles only when the theme changes.
 */
export const createUseStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: AppTheme) => T,
): (() => StyleSheet.NamedStyles<T>) => {
  return () => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
};
