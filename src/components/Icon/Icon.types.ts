import type { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons';

export type IconName = MaterialDesignIconsIconName;

export interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}
