import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useHassContext } from '@/context';
import { useHaptics, useTheme } from '@/hooks';
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
  const haptics = useHaptics();
  const sheetRef = useRef<TrueSheet>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredEntities = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return entities.filter(e => {
      if (domain && !e.entity_id.startsWith(domain)) return false;
      if (!query) return true;
      const friendlyName =
        typeof e.attributes.friendly_name === 'string'
          ? e.attributes.friendly_name
          : undefined;
      return (
        e.entity_id.toLowerCase().includes(query) ||
        (friendlyName?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [entities, searchText, domain]);

  const handleOpen = useCallback(() => {
    haptics.light();
    setSearchText('');
    sheetRef.current?.present();
    setHasOpened(true);
  }, [haptics]);

  const handleSelect = useCallback(
    (entityId: string) => {
      haptics.selection();
      onChangeValue(entityId);
      sheetRef.current?.dismiss();
    },
    [haptics, onChangeValue],
  );

  const handleDidDismiss = useCallback(() => {
    setHasOpened(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={handleOpen}
        accessibilityRole="button"
      >
        <Text
          style={value ? styles.triggerText : styles.triggerPlaceholder}
          numberOfLines={1}
        >
          {value || placeholder || 'Select entity…'}
        </Text>
      </Pressable>
      {hasOpened && (
        <TrueSheet
          ref={sheetRef}
          detents={['large']}
          cornerRadius={16}
          initialDetentIndex={0}
          grabber
          onDidDismiss={handleDidDismiss}
          backgroundColor={theme.surfaceContainerLow}
        >
          <View style={styles.sheetContent}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search entities…"
              placeholderTextColor={theme.onSurfaceVariant}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="search"
            />
            <FlatList
              data={filteredEntities}
              keyExtractor={item => item.entity_id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.entityRow, pressed && styles.entityRowPressed]}
                  onPress={() => handleSelect(item.entity_id)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    typeof item.attributes.friendly_name === 'string'
                      ? item.attributes.friendly_name
                      : item.entity_id
                  }
                >
                  <Text style={styles.friendlyName} numberOfLines={1}>
                    {typeof item.attributes.friendly_name === 'string'
                      ? item.attributes.friendly_name
                      : item.entity_id}
                  </Text>
                  <Text style={styles.entityId} numberOfLines={1}>
                    {item.entity_id}
                  </Text>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </TrueSheet>
      )}
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  trigger: {
    backgroundColor: theme.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.outline,
  },
  triggerPressed: {
    opacity: 0.7,
  },
  triggerText: {
    fontSize: 15,
    color: theme.onSurface,
  },
  triggerPlaceholder: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: theme.surfaceContainer,
    color: theme.onSurface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.outline,
    marginBottom: 12,
  },
  entityRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  entityRowPressed: {
    opacity: 0.7,
  },
  separator: {
    height: 1,
    backgroundColor: theme.outlineVariant,
    marginHorizontal: 14,
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
