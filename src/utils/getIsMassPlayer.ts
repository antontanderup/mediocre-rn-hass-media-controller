import type { MediaPlayerEntity } from '@/types';

/**
 * Determines if a player is a Music Assistant (MA) player.
 * A MA player has the `mass_player_type` attribute.
 * For Universal Media Players, checks if the active_child is a MA player.
 */
export function getIsMassPlayer(
  entity: Partial<MediaPlayerEntity>,
  allEntities: MediaPlayerEntity[],
): boolean {
  if (typeof entity?.attributes?.mass_player_type !== 'undefined') return true;

  if (typeof entity?.attributes?.active_child !== 'undefined') {
    const child = allEntities.find(
      e => e.entity_id === (entity.attributes?.active_child as string),
    );
    if (!child) return false;
    return getIsMassPlayer(child, allEntities);
  }

  return false;
}
