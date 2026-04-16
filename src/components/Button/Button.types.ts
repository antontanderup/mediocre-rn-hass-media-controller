export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'outlined' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonShape = 'default' | 'chip';

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

export interface ButtonContextValue {
  iconColor: string;
  iconSize: number;
  labelColor: string;
  labelSize: number;
}
