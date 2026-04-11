import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { useButtonContext } from './ButtonContext';

interface ButtonIconProps {
  name: IconName;
}

export const ButtonIcon = ({ name }: ButtonIconProps): React.JSX.Element => {
  const { iconColor, iconSize } = useButtonContext();
  return <Icon name={name} size={iconSize} color={iconColor} />;
};
