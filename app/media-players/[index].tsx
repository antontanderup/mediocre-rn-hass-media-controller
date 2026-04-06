import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntityPicker, Icon } from '@/components';
import { useAppConfig, useTheme } from '@/hooks';
import type { AppConfig, MediaBrowserEntry, MediaPlayerConfig } from '@/types';
import { createUseStyles } from '@/utils';

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayerConfigScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useStyles();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const { config, saveConfig } = useAppConfig();

  const index = parseInt(indexParam ?? '0', 10);
  const player = config?.mediaPlayers[index] ?? null;

  const [browserEntries, setBrowserEntries] = useState<MediaBrowserEntry[]>(
    player?.mediaBrowserEntries ?? [],
  );

  const form = useForm({
    defaultValues: {
      name: player?.name ?? '',
      speakerGroupEntityId: player?.speakerGroupEntityId ?? '',
      canBeGrouped: player?.canBeGrouped ?? false,
      searchEntityId: player?.search?.[0]?.entity_id ?? '',
      maEntityId: player?.maEntityId ?? '',
      maFavoriteButtonEntityId: player?.maFavoriteButtonEntityId ?? '',
      lmsEntityId: player?.lmsEntityId ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!config || !player) return;

      const searchEntityId = value.searchEntityId.trim();
      const cleanedEntries = browserEntries.filter(e => e.entity_id.trim().length > 0);
      const updated: MediaPlayerConfig = {
        entityId: player.entityId,
        name: value.name.trim() || null,
        speakerGroupEntityId: value.speakerGroupEntityId.trim() || null,
        canBeGrouped: value.canBeGrouped || null,
        search: searchEntityId ? [{ entity_id: searchEntityId }] : undefined,
        maEntityId: value.maEntityId.trim() || null,
        maFavoriteButtonEntityId: value.maFavoriteButtonEntityId.trim() || null,
        lmsEntityId: value.lmsEntityId.trim() || null,
        mediaBrowserEntries: cleanedEntries.length > 0 ? cleanedEntries : undefined,
      };

      const updatedPlayers = config.mediaPlayers.map((p, i) =>
        i === index ? updated : p,
      );

      const newConfig: AppConfig = {
        ...config,
        mediaPlayers: updatedPlayers,
      };

      await saveConfig(newConfig);
      router.back();
    },
  });

  const handleDelete = (): void => {
    if (!config) return;
    const updatedPlayers = config.mediaPlayers.filter((_, i) => i !== index);
    const newConfig: AppConfig = { ...config, mediaPlayers: updatedPlayers };
    saveConfig(newConfig)
      .then(() => router.back())
      .catch(() => {});
  };

  if (!player) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Player not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(40, bottomInset + 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Entity ID — read-only */}
        <Text style={styles.sectionLabel}>Entity</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Entity ID</Text>
          <Text style={styles.readOnlyValue}>{player.entityId}</Text>
        </View>

        {/* Name */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Display</Text>
        <form.Field name="name">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>Name override</Text>
              <TextInput
                style={styles.input}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={player.entityId}
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}
        </form.Field>

        {/* Grouping */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Grouping</Text>

        <form.Field name="canBeGrouped">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>Can be grouped</Text>
              <Switch
                value={field.state.value ?? false}
                onValueChange={field.handleChange}
                trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
                thumbColor={field.state.value ? theme.onPrimary : theme.onSurfaceVariant}
              />
            </View>
          )}
        </form.Field>

        <form.Field name="speakerGroupEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>Speaker group entity ID</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                placeholder="media_player.group_entity"
              />
            </View>
          )}
        </form.Field>

        {/* Search */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Search</Text>

        <form.Field name="searchEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>Search entity ID</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                placeholder={player.entityId}
              />
            </View>
          )}
        </form.Field>

        {/* Media Browser */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Media Browser</Text>
        <Text style={styles.hint}>
          Add entities whose media libraries can be browsed. When empty, the player&#39;s own entity
          is used.
        </Text>
        {browserEntries.map((entry, i) => (
          <View key={`mb-${i}`} style={styles.browserEntryRow}>
            <View style={styles.browserEntryFields}>
              <EntityPicker
                value={entry.entity_id}
                onChangeValue={val => {
                  const updated = [...browserEntries];
                  updated[i] = { ...entry, entity_id: val };
                  setBrowserEntries(updated);
                }}
                domain="media_player."
                placeholder="media_player.browse_entity"
              />
              <TextInput
                style={styles.browserEntryName}
                value={entry.name ?? ''}
                onChangeText={val => {
                  const updated = [...browserEntries];
                  updated[i] = { ...entry, name: val || null };
                  setBrowserEntries(updated);
                }}
                placeholder="Display name (optional)"
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Pressable
              style={styles.browserEntryRemoveBtn}
              onPress={() => setBrowserEntries(browserEntries.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel="Remove entry"
            >
              <Icon name="delete-bin-line" size={18} color={theme.error} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.addEntryButton}
          onPress={() => setBrowserEntries([...browserEntries, { entity_id: '' }])}
          accessibilityRole="button"
        >
          <Icon name="add-line" size={18} color={theme.primary} />
          <Text style={styles.addEntryText}>Add browser entry</Text>
        </Pressable>

        {/* Music Assistant */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Music Assistant</Text>

        <form.Field name="maEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>MA entity ID</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                placeholder="media_player.music_assistant_entity"
              />
            </View>
          )}
        </form.Field>

        <form.Field name="maFavoriteButtonEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>MA favorite button entity ID</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="script.ma_favorite"
              />
            </View>
          )}
        </form.Field>

        {/* LMS */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Logitech Media Server</Text>

        <form.Field name="lmsEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>LMS entity ID</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                placeholder="media_player.lms_entity"
              />
            </View>
          )}
        </form.Field>

        {/* Actions */}
        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Pressable
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={form.handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          )}
        </form.Subscribe>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
        >
          <Text style={styles.deleteButtonText}>Remove Player</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  flex: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  notFoundText: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: theme.primary,
    marginBottom: 12,
  },
  sectionLabelSpaced: {
    marginTop: 28,
  },
  readOnlyField: {
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  readOnlyLabel: {
    fontSize: 11,
    color: theme.onSurfaceVariant,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  readOnlyValue: {
    fontSize: 14,
    color: theme.onSurface,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    marginBottom: 6,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
    marginBottom: 12,
  },
  browserEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  browserEntryFields: {
    flex: 1,
    gap: 6,
  },
  browserEntryName: {
    backgroundColor: theme.surfaceContainer,
    color: theme.onSurface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: theme.outline,
  },
  browserEntryRemoveBtn: {
    padding: 8,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 4,
  },
  addEntryText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: theme.errorContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: theme.onErrorContainer,
    fontSize: 16,
    fontWeight: '600',
  },
}));
