import type { AppConfig, HassEntity, MediaPlayerConfig, MediaPlayerEntity } from '@/types';

type SelectActiveMediaPlayerParams = {
  players: MediaPlayerEntity[];
  entities: HassEntity[];
  config: AppConfig | null;
  selectedEntityId?: string;
};

/**
 * Selects the most appropriate player from the configured players and current HA state.
 * Returns the entity_id of the player that is currently playing (or paused, depending on config)
 * and is the group leader — or falls back to the first configured player.
 */
export const selectActiveMediaPlayer = ({
  players,
  entities,
  config,
  selectedEntityId,
}: SelectActiveMediaPlayerParams): string | undefined => {
  const configured = config?.mediaPlayers;
  if (!configured?.length) return selectedEntityId;

  const findPlayer = (entityId: string) => players.find(p => p.entity_id === entityId);

  // If focus switching is disabled, keep the current selection or fall back to first configured
  if (config?.options?.disablePlayerFocusSwitching) {
    if (selectedEntityId && findPlayer(selectedEntityId)) return selectedEntityId;
    return configured[0]?.entityId;
  }

  const activeWhen = config?.options?.playerIsActiveWhen ?? 'playing';

  const isActive = (state: string) => {
    if (activeWhen === 'playing') return state === 'playing';
    return state === 'playing' || state === 'paused';
  };

  const isGroupLeader = (cfg: MediaPlayerConfig) => {
    const groupEntityId = cfg.speakerGroupEntityId ?? cfg.entityId;
    const groupState = entities.find(e => e.entity_id === groupEntityId);
    const members = (groupState?.attributes as Record<string, unknown>)?.group_members;
    if (!Array.isArray(members) || members.length === 0) return true;
    return members[0] === groupEntityId;
  };

  // If the currently selected player is active and is the group leader, keep it
  if (selectedEntityId) {
    const selectedCfg = configured.find(c => c.entityId === selectedEntityId);
    const selectedPlayer = findPlayer(selectedEntityId);
    if (selectedCfg && selectedPlayer && isActive(selectedPlayer.state) && isGroupLeader(selectedCfg)) {
      return selectedEntityId;
    }
  }

  // Find the first configured player that is active and is the group leader
  for (const cfg of configured) {
    const player = findPlayer(cfg.entityId);
    if (player && isActive(player.state) && isGroupLeader(cfg)) {
      return cfg.entityId;
    }
  }

  // Fall back to current selection or first configured player
  if (selectedEntityId && findPlayer(selectedEntityId)) return selectedEntityId;
  return configured[0]?.entityId;
};
