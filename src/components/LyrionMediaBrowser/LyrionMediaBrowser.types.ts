import type React from 'react';

export type LyrionMediaBrowserProps = {
  entityId: string;
  renderHeader?: () => React.ReactNode;
  renderHeaderRight?: () => React.ReactNode;
};
