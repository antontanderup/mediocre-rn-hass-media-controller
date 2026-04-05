import React, { createContext, useCallback, useContext, useState } from 'react';

interface ActivePlayerContextValue {
  activePlayerId: string | null;
  setActivePlayerId: (id: string) => void;
}

const ActivePlayerContext = createContext<ActivePlayerContextValue | null>(null);

interface ActivePlayerProviderProps {
  children: React.ReactNode;
}

export const ActivePlayerProvider = ({ children }: ActivePlayerProviderProps): React.JSX.Element => {
  const [activePlayerId, setActivePlayerIdState] = useState<string | null>(null);

  const setActivePlayerId = useCallback((id: string) => {
    setActivePlayerIdState(id);
  }, []);

  return (
    <ActivePlayerContext.Provider value={{ activePlayerId, setActivePlayerId }}>
      {children}
    </ActivePlayerContext.Provider>
  );
};

export const useActivePlayer = (): ActivePlayerContextValue => {
  const ctx = useContext(ActivePlayerContext);
  if (!ctx) {
    throw new Error('useActivePlayer must be used within an ActivePlayerProvider');
  }
  return ctx;
};
