import React from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Icon } from '@/components/Icon';
import type { IconName } from '@/components/Icon';
import { useButtonContext } from './ButtonContext';

interface ButtonIconProps {
  name: IconName;
  style?: StyleProp<ViewStyle>;
}

export const ButtonIcon = ({ name, style }: ButtonIconProps): React.JSX.Element => {
  const { iconColor, iconSize } = useButtonContext();
  if (style) {
    return (
      <View style={style}>
        <Icon name={name} size={iconSize} color={iconColor} />
      </View>
    );
  }
  return <Icon name={name} size={iconSize} color={iconColor} />;
};
