import { useMemo, useState } from 'react';
import { useHassContext } from '@/context';
import { useAppConfig } from './useAppConfig';

export type SearchProvider =
  | { type: 'ha'; entityId: string; name: string }
  | { type: 'ma'; maEntityId: string; name: string };

export type UseSearchProviderResult = {
  providers: SearchProvider[];
  selected: SearchProvider | null;
  select: (provider: SearchProvider) => void;
};

export const useSearchProvider = (entityId: string): UseSearchProviderResult => {
  const { players } = useHassContext();
  const { config: appConfig } = useAppConfig();

  const playerConfig = appConfig?.mediaPlayers.find(p => p.entityId === entityId);

  const providers = useMemo<SearchProvider[]>(() => {
    const list: SearchProvider[] = [];

    // HA search providers from config; fall back to the player entity itself
    const searchConfigs = playerConfig?.search;
    if (searchConfigs && searchConfigs.length > 0) {
      for (const sc of searchConfigs) {
        const friendlyName =
          sc.name ??
          players.find(p => p.entity_id === sc.entity_id)?.attributes.friendly_name ??
          sc.entity_id;
        list.push({ type: 'ha', entityId: sc.entity_id, name: friendlyName });
      }
    } else {
      const friendlyName =
        players.find(p => p.entity_id === entityId)?.attributes.friendly_name ?? entityId;
      list.push({ type: 'ha', entityId, name: friendlyName });
    }

    // Music Assistant — always appended when maEntityId is configured
    if (playerConfig?.maEntityId) {
      list.push({ type: 'ma', maEntityId: playerConfig.maEntityId, name: 'Music Assistant' });
    }

    return list;
  }, [entityId, playerConfig, players]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo<SearchProvider | null>(() => {
    if (!providers.length) return null;
    if (!selectedId) return providers[0];
    return (
      providers.find((p: SearchProvider) =>
        p.type === 'ha' ? p.entityId === selectedId : p.maEntityId === selectedId,
      ) ?? providers[0]
    );
  }, [providers, selectedId]);

  const select = (provider: SearchProvider) => {
    setSelectedId(provider.type === 'ha' ? provider.entityId : provider.maEntityId);
  };

  return useMemo(() => ({ providers, selected, select }), [providers, selected]);
};
