import type { MediaBrowserEntry } from '@/types';

export interface HaMediaBrowserProps {
  /** Fallback entity used when no mediaBrowserEntries are configured. */
  entityId: string;
  hassBaseUrl: string;
  /** Configured media browser entries. When provided, the user can switch between them. */
  mediaBrowserEntries?: MediaBrowserEntry[];
}
