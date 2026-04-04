import {
  argbFromHex,
  hexFromArgb,
  Hct,
  MaterialDynamicColors,
  SchemeTonalSpot,
} from '@material/material-color-utilities';
import type { AppTheme } from '@/types';

export const buildTheme = (
  sourceHex: string,
  colorScheme: 'light' | 'dark',
): AppTheme => {
  const argb = argbFromHex(sourceHex);
  const hct = Hct.fromInt(argb);
  const scheme = new SchemeTonalSpot(hct, colorScheme === 'dark', 0.0);

  const c = (dc: { getArgb: (s: typeof scheme) => number }): string =>
    hexFromArgb(dc.getArgb(scheme));

  return {
    sourceColor: sourceHex,
    colorScheme,
    primary: c(MaterialDynamicColors.primary),
    onPrimary: c(MaterialDynamicColors.onPrimary),
    primaryContainer: c(MaterialDynamicColors.primaryContainer),
    onPrimaryContainer: c(MaterialDynamicColors.onPrimaryContainer),
    secondary: c(MaterialDynamicColors.secondary),
    onSecondary: c(MaterialDynamicColors.onSecondary),
    secondaryContainer: c(MaterialDynamicColors.secondaryContainer),
    onSecondaryContainer: c(MaterialDynamicColors.onSecondaryContainer),
    tertiary: c(MaterialDynamicColors.tertiary),
    onTertiary: c(MaterialDynamicColors.onTertiary),
    tertiaryContainer: c(MaterialDynamicColors.tertiaryContainer),
    onTertiaryContainer: c(MaterialDynamicColors.onTertiaryContainer),
    error: c(MaterialDynamicColors.error),
    onError: c(MaterialDynamicColors.onError),
    errorContainer: c(MaterialDynamicColors.errorContainer),
    onErrorContainer: c(MaterialDynamicColors.onErrorContainer),
    background: c(MaterialDynamicColors.background),
    onBackground: c(MaterialDynamicColors.onBackground),
    surface: c(MaterialDynamicColors.surface),
    onSurface: c(MaterialDynamicColors.onSurface),
    surfaceVariant: c(MaterialDynamicColors.surfaceVariant),
    onSurfaceVariant: c(MaterialDynamicColors.onSurfaceVariant),
    surfaceContainerLow: c(MaterialDynamicColors.surfaceContainerLow),
    surfaceContainer: c(MaterialDynamicColors.surfaceContainer),
    surfaceContainerHigh: c(MaterialDynamicColors.surfaceContainerHigh),
    outline: c(MaterialDynamicColors.outline),
    outlineVariant: c(MaterialDynamicColors.outlineVariant),
    inverseSurface: c(MaterialDynamicColors.inverseSurface),
    inverseOnSurface: c(MaterialDynamicColors.inverseOnSurface),
    inversePrimary: c(MaterialDynamicColors.inversePrimary),
    shadow: c(MaterialDynamicColors.shadow),
    scrim: c(MaterialDynamicColors.scrim),
  };
};
