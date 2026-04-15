import type React from 'react';

export type LyrionMediaBrowserProps = {
  entityId: string;
  renderHeader?: () => React.ReactNode;
  onNavDepthChange?: (depth: number) => void;
};
