import type { HassConfig } from '@/types';
import { buildHassUrl } from './buildHassUrl';

/**
 * Resolves a potentially-relative Home Assistant URL (e.g. entity_picture)
 * to an absolute URL by prepending the HA base URL when necessary.
 */
export const resolveHassUrl = (path: string, config: HassConfig): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${buildHassUrl(config)}${path}`;
};
