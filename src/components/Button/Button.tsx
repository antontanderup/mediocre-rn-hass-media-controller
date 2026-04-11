import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const ICON_SIZES: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 22,
};

const ICON_GAP: Record<ButtonSize, number> = {
  sm: 4,
  md: 6,
  lg: 8,
};

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const haptics = useHaptics();

  const containerVariantStyle = (
    {
      primary: styles.variantPrimary,
      secondary: styles.variantSecondary,
      outlined: styles.variantOutlined,
      ghost: styles.variantGhost,
    } satisfies Record<ButtonVariant, object>
  )[variant];

  const labelVariantStyle = (
    {
      primary: styles.labelPrimary,
      secondary: styles.labelSecondary,
      outlined: styles.labelOutlined,
      ghost: styles.labelGhost,
    } satisfies Record<ButtonVariant, object>
  )[variant];

  const containerSizeStyle = (
    {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    } satisfies Record<ButtonSize, object>
  )[size];

  const labelSizeStyle = (
    {
      sm: styles.labelSm,
      md: styles.labelMd,
      lg: styles.labelLg,
    } satisfies Record<ButtonSize, object>
  )[size];

  const iconColor = (
    {
      primary: theme.onPrimary,
      secondary: theme.onSecondaryContainer,
      outlined: theme.primary,
      ghost: theme.primary,
    } satisfies Record<ButtonVariant, string>
  )[variant];

  const handlePress = (): void => {
    haptics.light();
    onPress();
  };

  const isInteractionDisabled = disabled || loading;

  return (
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
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInteractionDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon name={icon} size={ICON_SIZES[size]} color={iconColor} />
          ) : null}
          <Text
            style={[
              styles.label,
              labelVariantStyle,
              labelSizeStyle,
              icon ? { marginLeft: ICON_GAP[size] } : undefined,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
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

  // --- variant container styles ---
  variantPrimary: {
    backgroundColor: theme.primary,
  },
  variantSecondary: {
    backgroundColor: theme.secondaryContainer,
  },
  variantOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.outline,
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },

  // --- variant label colors ---
  labelPrimary: {
    color: theme.onPrimary,
  },
  labelSecondary: {
    color: theme.onSecondaryContainer,
  },
  labelOutlined: {
    color: theme.primary,
  },
  labelGhost: {
    color: theme.primary,
  },

  // --- size container padding ---
  sizeSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 64,
  },
  sizeMd: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 88,
  },
  sizeLg: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minWidth: 112,
  },

  // --- size label font ---
  label: {
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 13,
  },
  labelMd: {
    fontSize: 15,
  },
  labelLg: {
    fontSize: 17,
  },
}));
