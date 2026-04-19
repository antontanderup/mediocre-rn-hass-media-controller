import React from 'react';
import type { MediaItemSheetProps } from './MediaItemSheet.types';

// Web stub — TrueSheet is native-only; just render the trigger on web.
export const MediaItemSheet = ({ renderTrigger }: MediaItemSheetProps): React.JSX.Element =>
  <>{renderTrigger(() => {})}</>;
