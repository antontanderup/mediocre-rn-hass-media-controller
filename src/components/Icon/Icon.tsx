import MaterialIcon from '@react-native-vector-icons/material-icons';
import type { IconProps } from './Icon.types';

export const Icon = ({ name, size = 24, color }: IconProps): React.JSX.Element => {
  return <MaterialIcon name={name} size={size} color={color} />;
};
