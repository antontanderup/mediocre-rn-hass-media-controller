import type { MediaPlayerEntity } from '@/types';

/**
 * Determines if a player is an LMS (Lyrion Media Server) player.
 * For Universal Media Players, checks if the active_child matches the LMS entity ID.
 */
export function getIsLmsPlayer(
  entity: Partial<MediaPlayerEntity>,
  lmsEntityId: string,
): boolean {
  if (entity.entity_id === lmsEntityId) return true;

  if (typeof entity?.attributes?.active_child !== 'undefined') {
    return (entity.attributes.active_child as string) === lmsEntityId;
  }

  return false;
}
