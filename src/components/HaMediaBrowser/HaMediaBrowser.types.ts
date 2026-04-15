export interface HaMediaBrowserProps {
  /** The entity ID of the media browser to use. */
  entityId: string;
  hassBaseUrl: string;
  onNavDepthChange?: (depth: number) => void;
}
