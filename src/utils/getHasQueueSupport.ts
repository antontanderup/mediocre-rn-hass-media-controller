import type { MediaPlayerConfig, MediaPlayerEntity } from '@/types';
import { getHasMassFeatures } from './getHasMassFeatures';
import { getIsLmsPlayer } from './getIsLmsPlayer';

export type QueueSupportResult = {
  isMA: boolean;
  isLMS: boolean;
} | null;

/**
 * Determines whether queue support is available for a player.
 *
 * Step 1: checks whether the player has a configured MA or LMS entity ID.
 *         Returns null immediately if neither is set.
 * Step 2: checks whether the required integration (mass_queue / lyrion_cli)
 *         is present in the list of loaded config-entry domains.
 *         Returns null if the relevant integration is not loaded.
 *
 * @param entityId       - The primary entity ID of the player
 * @param playerConfig   - Per-player configuration (may be undefined if not yet saved)
 * @param players        - All known media-player entities (used for UMP child detection)
 * @param loadedDomains  - Domains of Home Assistant config entries whose state is "loaded"
 */
export function getHasQueueSupport(
  entityId: string,
  playerConfig: MediaPlayerConfig | null | undefined,
  players: MediaPlayerEntity[],
  loadedDomains: string[],
): QueueSupportResult {
  // Step 1 – entity IDs
  const hasMaEntity = getHasMassFeatures(entityId, playerConfig?.maEntityId ?? null, players);
  const player = players.find(p => p.entity_id === entityId);
  const hasLmsEntity = playerConfig?.lmsEntityId
    ? getIsLmsPlayer(player ?? {}, playerConfig.lmsEntityId)
    : false;

  if (!hasMaEntity && !hasLmsEntity) return null;

  // Step 2 – integrations
  // Even if the integration is not loaded yet, return a non-null result so the
  // queue tab stays visible and shows a "not available" message rather than
  // disappearing entirely. isAvailable in usePlayerQueue drives that UI state.
  const isMA = hasMaEntity && loadedDomains.includes('mass_queue');
  const isLMS = hasLmsEntity && loadedDomains.includes('lyrion_cli');

  return { isMA, isLMS };
}
