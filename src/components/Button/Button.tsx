import { ActivityIndicator, Pressable, View } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { ButtonContext } from './ButtonContext';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const ICON_SIZES: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

const LABEL_SIZES: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

const CONTENT_GAPS: Record<ButtonSize, number> = {
  sm: 4,
  md: 6,
  lg: 8,
};

export const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const fgColor = (
    {
      primary: theme.onPrimary,
      secondary: theme.onSecondaryContainer,
      surface: theme.onSurfaceVariant,
      outlined: theme.primary,
      ghost: theme.primary,
      subtle: theme.onSurfaceVariant,
    } satisfies Record<ButtonVariant, string>
  )[variant];

  const containerVariantStyle = (
    {
      primary: styles.variantPrimary,
      secondary: styles.variantSecondary,
      surface: styles.variantSurface,
      outlined: styles.variantOutlined,
      ghost: styles.variantGhost,
      subtle: styles.variantSubtle,
    } satisfies Record<ButtonVariant, object>
  )[variant];

  const containerSizeStyle = (
    {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    } satisfies Record<ButtonSize, object>
  )[size];

  const isInteractionDisabled = disabled || loading;

  const handlePress = (): void => {
    haptics.light();
    onPress();
  };

  return (
    <ButtonContext.Provider
      value={{
        iconColor: fgColor,
        iconSize: ICON_SIZES[size],
        labelColor: fgColor,
        labelSize: LABEL_SIZES[size],
      }}
    >
      <Pressable
        style={({ pressed }) => [
          styles.base,
          containerVariantStyle,
          containerSizeStyle,
          pressed && !isInteractionDisabled && styles.pressed,
          isInteractionDisabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={isInteractionDisabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isInteractionDisabled }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={fgColor} />
        ) : (
          <View style={[styles.content, { gap: CONTENT_GAPS[size] }]}>{children}</View>
        )}
      </Pressable>
    </ButtonContext.Provider>
  );
};

const useStyles = createUseStyles(theme => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
  variantPrimary: {
    backgroundColor: theme.primary,
  },
  variantSecondary: {
    backgroundColor: theme.secondaryContainer,
  },
  variantSurface: {
    backgroundColor: theme.surfaceContainerHigh,
  },
  variantOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.outline,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantSubtle: {
    backgroundColor: 'transparent',
  },
  sizeSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sizeMd: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sizeLg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
}));
