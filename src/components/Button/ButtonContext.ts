import { createContext, useContext } from 'react';
import type { ButtonContextValue } from './Button.types';

export const ButtonContext = createContext<ButtonContextValue | null>(null);

export const useButtonContext = (): ButtonContextValue => {
  const ctx = useContext(ButtonContext);
  if (!ctx) throw new Error('useButtonContext must be called inside a Button');
  return ctx;
};
