import React from 'react';
import type { BottomSheetSelectProps } from './BottomSheetSelect.types';

// Web stub — TrueSheet is native-only; just render the trigger on web.
export const BottomSheetSelect = <T extends string = string>({
  renderTrigger,
}: BottomSheetSelectProps<T>): React.JSX.Element => <>{renderTrigger(() => {})}</>;
