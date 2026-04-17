import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useHaptics, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { SearchFieldProps } from './SearchField.types';

export const SearchField = React.forwardRef<TextInput, SearchFieldProps>(
  function SearchField({ value, onChangeText, placeholder, style }, ref) {
    const styles = useStyles();
    const theme = useTheme();
    const haptics = useHaptics();

    return (
      <View style={[styles.container, style]}>
        <Icon name="magnify" size={18} color={theme.onSurfaceVariant} />
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.onSurfaceVariant}
          returnKeyType="search"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {value.length > 0 && (
          <Pressable
            hitSlop={8}
            style={({ pressed }) => pressed && styles.clearBtnPressed}
            onPress={() => { haptics.light(); onChangeText(''); }}
            accessibilityRole="button"
          >
            <Icon name="close" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
    );
  },
);

const useStyles = createUseStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.onSurface,
    padding: 0,
  },
  clearBtnPressed: {
    opacity: 0.5,
  },
}));
