import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useHassContext } from '@/context';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import type { EntityPickerProps } from './EntityPicker.types';

// ─── Component ────────────────────────────────────────────────────────────────

export const EntityPicker = ({
  value,
  onChangeValue,
  onBlur,
  domain,
  placeholder,
}: EntityPickerProps): React.JSX.Element => {
  const { entities } = useHassContext();
  const styles = useStyles();
  const theme = useTheme();
  const [inputText, setInputText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  // Sync displayed text when the value is changed externally
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const suggestions = useMemo(() => {
    const query = inputText.trim().toLowerCase();
    if (!query) return [];
    return entities
      .filter(e => {
        if (domain && !e.entity_id.startsWith(domain)) return false;
        const friendlyName = typeof e.attributes.friendly_name === 'string' ? e.attributes.friendly_name : undefined;
        return (
          e.entity_id.toLowerCase().includes(query) ||
          (friendlyName?.toLowerCase().includes(query) ?? false)
        );
      })
      .slice(0, 8);
  }, [entities, inputText, domain]);

  const showSuggestions = isFocused && suggestions.length > 0;

  const handleChangeText = (text: string): void => {
    setInputText(text);
    onChangeValue(text);
  };

  const handleSelect = (entityId: string): void => {
    setInputText(entityId);
    onChangeValue(entityId);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, showSuggestions && styles.containerOpen]}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.onSurfaceVariant}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
        blurOnSubmit={true}
      />
      {showSuggestions && (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((entity, idx) => (
              <Pressable
                key={entity.entity_id}
                style={[styles.suggestion, idx < suggestions.length - 1 && styles.suggestionDivider]}
                onPress={() => handleSelect(entity.entity_id)}
              >
                <Text style={styles.friendlyName} numberOfLines={1}>
                  {typeof entity.attributes.friendly_name === 'string'
                    ? entity.attributes.friendly_name
                    : entity.entity_id}
                </Text>
                <Text style={styles.entityId} numberOfLines={1}>
                  {entity.entity_id}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  containerOpen: {
    zIndex: 10,
  },
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
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: theme.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    maxHeight: 280,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  friendlyName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.onSurface,
    marginBottom: 2,
  },
  entityId: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
  },
}));
