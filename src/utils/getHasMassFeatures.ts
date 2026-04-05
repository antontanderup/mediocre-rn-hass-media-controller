import type { MediaPlayerEntity } from '@/types';
import { getIsMassPlayer } from './getIsMassPlayer';

/**
 * Returns true if we are confident that the user wants to use Music Assistant features
 * for the given entity.
 */
export function getHasMassFeatures(
  entityId: string,
  maEntityId: string | null | undefined,
  allEntities: MediaPlayerEntity[],
): boolean {
  if (entityId === maEntityId) return true;

  const entity = allEntities.find(e => e.entity_id === entityId);
  if (!entity) return false;

  if (getIsMassPlayer(entity, allEntities)) return true;

  if (typeof entity.attributes?.active_child !== 'undefined') {
    // getIsMassPlayer checks active_child recursively, so if we reach here the
    // active_child is not a MA player — this UMP is not using MA.
    return false;
  }

  if (maEntityId) {
    // No active_child property — this is not a Universal Media Player.
    // Trust that the user wants MA features if maEntityId is configured.
    return true;
  }

  return false;
}
