import React, { createContext, useCallback, useContext, useState } from 'react';

interface SelectedPlayerContextValue {
  entityId: string | undefined;
  setEntityId: (entityId: string) => void;
}

const SelectedPlayerContext = createContext<SelectedPlayerContextValue>({
  entityId: undefined,
  setEntityId: () => {},
});

export const useSelectedPlayerContext = (): SelectedPlayerContextValue =>
  useContext(SelectedPlayerContext);

export const SelectedPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [entityId, setEntityIdState] = useState<string | undefined>(undefined);

  const setEntityId = useCallback((id: string) => {
    setEntityIdState(id);
  }, []);

  return (
    <SelectedPlayerContext.Provider value={{ entityId, setEntityId }}>
      {children}
    </SelectedPlayerContext.Provider>
  );
};
