import React from 'react';
import { TextInput } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import type { EntityPickerProps } from './EntityPicker.types';

// Web stub — TrueSheet is native-only; render a plain text input on web.
export const EntityPicker = ({
  value,
  onChangeValue,
  onBlur,
  placeholder,
}: EntityPickerProps): React.JSX.Element => {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeValue}
      onBlur={onBlur}
      placeholder={placeholder ?? 'Select entity…'}
      placeholderTextColor={theme.onSurfaceVariant}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
};

const useStyles = createUseStyles(theme => ({
  input: {
    backgroundColor: theme.surfaceContainer,
    color: theme.onSurface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.outline,
  },
}));
