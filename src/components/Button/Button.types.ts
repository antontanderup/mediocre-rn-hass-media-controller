export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'outlined' | 'ghost' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export interface ButtonContextValue {
  iconColor: string;
  iconSize: number;
  labelColor: string;
  labelSize: number;
}
