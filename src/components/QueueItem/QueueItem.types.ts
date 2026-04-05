import type { QueueItem } from '@/types';

export interface QueueItemProps {
  item: QueueItem;
  onPress: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}
