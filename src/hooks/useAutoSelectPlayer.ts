import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useHassContext, useSelectedPlayerContext } from '@/context';
import { useAppConfig } from './useAppConfig';
import { selectActiveMediaPlayer } from '@/utils';

/**
 * Auto-selects a media player when none is currently selected.
 * Runs once when players first become available, then stays out of the way.
 */
export const useAutoSelectPlayer = () => {
  const router = useRouter();
  const { players, entities } = useHassContext();
  const { config: appConfig } = useAppConfig();
  const { entityId, setEntityId } = useSelectedPlayerContext();
  const hasAutoSelected = useRef(false);

  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (entityId) return;
    if (!players.length) return;

    const activeEntityId = selectActiveMediaPlayer({
      players,
      entities,
      config: appConfig,
    });

    if (activeEntityId) {
      hasAutoSelected.current = true;
      setEntityId(activeEntityId);
      router.replace('/media-player');
    }
  }, [players, entities, appConfig, entityId, setEntityId, router]);
};
