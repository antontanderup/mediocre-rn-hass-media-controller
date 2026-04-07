import type React from 'react';
import type { IconName } from '@/components/Icon';

export interface BottomSheetSelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: IconName;
}

export interface BottomSheetSelectProps<T extends string = string> {
  options: BottomSheetSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  title?: string;
  renderTrigger: (onOpen: () => void) => React.ReactNode;
}
