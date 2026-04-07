import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useHassContext } from '@/context';
import { useAppConfig } from './useAppConfig';
import { selectActiveMediaPlayer } from '@/utils';

/**
 * Auto-selects a media player when none is currently selected.
 * Runs once when players first become available, then stays out of the way.
 * Call from the tabs layout.
 */
export const useAutoSelectPlayer = () => {
  const router = useRouter();
  const { players, entities } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (!players.length) return;

    const activeEntityId = selectActiveMediaPlayer({
      players,
      entities,
      config: appConfig,
    });

    if (activeEntityId) {
      hasAutoSelected.current = true;
      router.navigate({ pathname: '/(tabs)/player', params: { entityId: activeEntityId } });
    }
  }, [players, entities, appConfig, router]);
};
