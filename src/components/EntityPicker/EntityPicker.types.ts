export interface EntityPickerProps {
  value: string;
  onChangeValue: (entityId: string) => void;
  onBlur?: () => void;
  /** Filter suggestions to entities whose entity_id starts with this domain prefix, e.g. 'media_player.' */
  domain?: string;
  placeholder?: string;
}
