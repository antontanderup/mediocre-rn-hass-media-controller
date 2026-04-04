import RemixIcon from 'react-native-remix-icon';
import type { IconProps } from './Icon.types';

export const Icon = ({ name, size = 24, color }: IconProps): React.JSX.Element => {
  return <RemixIcon name={name} size={size} color={color} />;
};
