import type { HaFilterConfig } from '@/types';

export type HaSearchProps = {
  entityId: string;
  hassBaseUrl: string;
  showFavorites?: boolean;
  filterConfig?: HaFilterConfig[];
};
