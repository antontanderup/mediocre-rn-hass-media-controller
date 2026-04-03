import type { HassEntity, MediaPlayerEntity } from '@/types';

/**
 * Type guard — narrows a generic HassEntity to MediaPlayerEntity.
 */
export const isMediaPlayerEntity = (entity: HassEntity): entity is MediaPlayerEntity =>
  entity.entity_id.startsWith('media_player.');
