import { useMemo } from 'react';
import { useTheme } from '@/hooks';
import type { AppTheme } from '@/types';

/**
 * Factory that creates a typed `useStyles` hook bound to the current theme.
 *
 * Usage:
 * ```ts
 * const useStyles = createUseStyles(theme =>
 *   StyleSheet.create({
 *     container: { backgroundColor: theme.background },
 *   })
 * );
 *
 * // Inside a component:
 * const styles = useStyles();
 * ```
 *
 * The returned hook re-derives styles only when the theme changes.
 */
export const createUseStyles = <T>(factory: (theme: AppTheme) => T): (() => T) => {
  return () => {
    const theme = useTheme();
    return useMemo(() => factory(theme), [theme]);
  };
};
