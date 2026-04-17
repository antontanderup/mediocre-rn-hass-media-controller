import { useEffect, useState } from 'react';
import { useHassContext } from '@/context';

type ConfigEntry = {
  entry_id: string;
  domain: string;
  state: string;
};

/**
 * Fetches all Home Assistant config entries and returns the domains whose
 * state is "loaded". Returns null while the request is in flight.
 */
export const useConfigEntries = (): string[] | null => {
  const { sendMessage } = useHassContext();
  const [loadedDomains, setLoadedDomains] = useState<string[] | null>(null);

  useEffect(() => {
    sendMessage<ConfigEntry[]>({ type: 'config_entries/get' })
      .then(entries =>
        setLoadedDomains(entries.filter(e => e.state === 'loaded').map(e => e.domain)),
      )
      .catch(() => setLoadedDomains([]));
  }, [sendMessage]);

  return loadedDomains;
};
