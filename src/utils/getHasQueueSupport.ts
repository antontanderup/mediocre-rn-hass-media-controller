import type { MediaPlayerConfig, MediaPlayerEntity } from '@/types';
import { getHasMassFeatures } from './getHasMassFeatures';
import { getIsLmsPlayer } from './getIsLmsPlayer';

export type QueueSupportResult = {
  isMA: boolean;
  isLMS: boolean;
} | null;

/**
 * Determines whether queue support could be available for a player based on
 * configured entity IDs alone. Integration availability (whether lyrion_cli or
 * mass_queue is actually reachable) is probed separately in usePlayerQueue via
 * real service calls.
 *
 * Returns null when neither MA nor LMS entity IDs are configured/detected —
 * the queue tab is hidden entirely. Returns a non-null object when at least one
 * entity ID is found — the tab is shown and usePlayerQueue drives the
 * isAvailable flag via live probe calls.
 *
 * @param entityId       - The primary entity ID of the player
 * @param playerConfig   - Per-player configuration (may be undefined if not yet saved)
 * @param players        - All known media-player entities (used for UMP child detection)
 */
export function getHasQueueSupport(
  entityId: string,
  playerConfig: MediaPlayerConfig | null | undefined,
  players: MediaPlayerEntity[],
): QueueSupportResult {
  const hasMaEntity = getHasMassFeatures(entityId, playerConfig?.maEntityId ?? null, players);
  const player = players.find(p => p.entity_id === entityId);
  const hasLmsEntity = playerConfig?.lmsEntityId
    ? getIsLmsPlayer(player ?? {}, playerConfig.lmsEntityId)
    : false;

  if (!hasMaEntity && !hasLmsEntity) return null;

  return { isMA: hasMaEntity, isLMS: hasLmsEntity };
}
