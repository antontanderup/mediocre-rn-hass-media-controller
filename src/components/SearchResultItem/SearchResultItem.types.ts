export type SearchResultItemProps = {
  title: string;
  subtitle?: string;
  thumbnail?: string;
  /** Used to pick a fallback icon when thumbnail is absent */
  mediaClass?: string;
  onPlay: () => void;
  /** When provided an "add to queue" button is shown */
  onEnqueue?: () => void;
};
