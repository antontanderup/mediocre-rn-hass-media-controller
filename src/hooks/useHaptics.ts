import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export const useHaptics = () => {
  const light = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const medium = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavy = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const selection = useCallback((): void => {
    void Haptics.selectionAsync();
  }, []);

  return { light, medium, heavy, selection };
};
