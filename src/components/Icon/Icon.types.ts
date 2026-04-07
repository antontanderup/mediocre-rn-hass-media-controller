import type { MaterialIconsIconName } from '@react-native-vector-icons/material-icons';

export type IconName = MaterialIconsIconName;

export interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}
