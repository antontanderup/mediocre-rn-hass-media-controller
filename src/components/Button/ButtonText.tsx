import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { createUseStyles } from '@/utils';
import { useButtonContext } from './ButtonContext';

interface ButtonTextProps {
  children: React.ReactNode;
  numberOfLines?: number;
  style?: TextStyle;
}

export const ButtonText = ({ children, numberOfLines, style }: ButtonTextProps): React.JSX.Element => {
  const { labelColor, labelSize } = useButtonContext();
  const styles = useStyles();

  return (
    <Text
      style={[styles.label, { color: labelColor, fontSize: labelSize }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const useStyles = createUseStyles(() => ({
  label: {
    fontWeight: '600',
  },
}));
