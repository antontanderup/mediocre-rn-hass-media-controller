import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import type { AppConfig, MediaBrowserEntry, MediaPlayerConfig, SearchEntry } from '@/types';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';

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

  const [searchEntries, setSearchEntries] = useState<SearchEntry[]>(
    player?.searchEntries ?? [],
  );
  const [browserEntries, setBrowserEntries] = useState<MediaBrowserEntry[]>(
    player?.mediaBrowserEntries ?? [],
  );

  // Sync local state when config loads asynchronously
  useEffect(() => {
    if (player) {
      setSearchEntries(player.searchEntries ?? []);
      setBrowserEntries(player.mediaBrowserEntries ?? []);
    }
  }, [player]);

  const form = useForm({
    defaultValues: {
      name: player?.name ?? '',
      speakerGroupEntityId: player?.speakerGroupEntityId ?? '',
      canBeGrouped: player?.canBeGrouped ?? false,
      maEntityId: player?.maEntityId ?? '',
      maFavoriteButtonEntityId: player?.maFavoriteButtonEntityId ?? '',
      lmsEntityId: player?.lmsEntityId ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!config || !player) return;

      const cleanedSearchEntries = searchEntries.filter(e => e.entity_id.trim().length > 0);
      const cleanedBrowserEntries = browserEntries.filter(e => e.entity_id.trim().length > 0);
      const updated: MediaPlayerConfig = {
        entityId: player.entityId,
        name: value.name.trim() || null,
        speakerGroupEntityId: value.speakerGroupEntityId.trim() || null,
        canBeGrouped: value.canBeGrouped || null,
        searchEntries: cleanedSearchEntries.length > 0 ? cleanedSearchEntries : undefined,
        maEntityId: value.maEntityId.trim() || null,
        maFavoriteButtonEntityId: value.maFavoriteButtonEntityId.trim() || null,
        lmsEntityId: value.lmsEntityId.trim() || null,
        mediaBrowserEntries: cleanedBrowserEntries.length > 0 ? cleanedBrowserEntries : undefined,
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
        <Text style={styles.notFoundText}>{t('playerConfig.notFound')}</Text>
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
        <Text style={styles.sectionLabel}>{t('playerConfig.section.entity')}</Text>
        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>{t('playerConfig.field.entityId')}</Text>
          <Text style={styles.readOnlyValue}>{player.entityId}</Text>
        </View>

        {/* Name */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.display')}</Text>
        <form.Field name="name">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('playerConfig.field.nameOverride')}</Text>
              <TextInput
                style={styles.input}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={player.entityId}
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          )}
        </form.Field>

        {/* Grouping */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.grouping')}</Text>

        <form.Field name="canBeGrouped">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>{t('playerConfig.field.canBeGrouped')}</Text>
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
              <Text style={styles.label}>{t('playerConfig.field.speakerGroupEntityId.label')}</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                label={t('playerConfig.field.speakerGroupEntityId.label')}
                placeholder={t('playerConfig.field.speakerGroupEntityId.placeholder')}
              />
            </View>
          )}
        </form.Field>

        {/* Search */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.search')}</Text>
        <Text style={styles.hint}>{t('playerConfig.search.hint')}</Text>
        {searchEntries.map((entry, i) => (
          <View key={`se-${i}`} style={styles.browserEntryRow}>
            <View style={styles.browserEntryFields}>
              <EntityPicker
                value={entry.entity_id}
                onChangeValue={val => {
                  const updated = [...searchEntries];
                  updated[i] = { ...entry, entity_id: val };
                  setSearchEntries(updated);
                }}
                domain="media_player."
                label={t('playerConfig.field.searchEntity.label')}
                placeholder={t('playerConfig.field.searchEntity.placeholder')}
              />
              <TextInput
                style={styles.browserEntryName}
                value={entry.name ?? ''}
                onChangeText={val => {
                  const updated = [...searchEntries];
                  updated[i] = { ...entry, name: val || null };
                  setSearchEntries(updated);
                }}
                placeholder={t('playerConfig.field.displayName.placeholder')}
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
            <Pressable
              style={styles.browserEntryRemoveBtn}
              onPress={() => setSearchEntries(searchEntries.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel={t('playerConfig.removeEntry')}
            >
              <Icon name="delete" size={18} color={theme.error} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.addEntryButton}
          onPress={() => setSearchEntries([...searchEntries, { entity_id: '' }])}
          accessibilityRole="button"
        >
          <Icon name="plus" size={18} color={theme.primary} />
          <Text style={styles.addEntryText}>{t('playerConfig.addSearchEntry')}</Text>
        </Pressable>

        {/* Media Browser */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.mediaBrowser')}</Text>
        <Text style={styles.hint}>{t('playerConfig.mediaBrowser.hint')}</Text>
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
                label={t('playerConfig.field.browseEntity.label')}
                placeholder={t('playerConfig.field.browseEntity.placeholder')}
              />
              <TextInput
                style={styles.browserEntryName}
                value={entry.name ?? ''}
                onChangeText={val => {
                  const updated = [...browserEntries];
                  updated[i] = { ...entry, name: val || null };
                  setBrowserEntries(updated);
                }}
                placeholder={t('playerConfig.field.displayName.placeholder')}
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
            <Pressable
              style={styles.browserEntryRemoveBtn}
              onPress={() => setBrowserEntries(browserEntries.filter((_, j) => j !== i))}
              accessibilityRole="button"
              accessibilityLabel={t('playerConfig.removeEntry')}
            >
              <Icon name="delete" size={18} color={theme.error} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.addEntryButton}
          onPress={() => setBrowserEntries([...browserEntries, { entity_id: '' }])}
          accessibilityRole="button"
        >
          <Icon name="plus" size={18} color={theme.primary} />
          <Text style={styles.addEntryText}>{t('playerConfig.addBrowserEntry')}</Text>
        </Pressable>

        {/* Music Assistant */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.musicAssistant')}</Text>

        <form.Field name="maEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('playerConfig.field.maEntityId.label')}</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                label={t('playerConfig.field.maEntityId.label')}
                placeholder={t('playerConfig.field.maEntityId.placeholder')}
              />
            </View>
          )}
        </form.Field>

        <form.Field name="maFavoriteButtonEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('playerConfig.field.maFavoriteButtonEntityId.label')}</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                label={t('playerConfig.field.maFavoriteButtonEntityId.label')}
                placeholder={t('playerConfig.field.maFavoriteButtonEntityId.placeholder')}
              />
            </View>
          )}
        </form.Field>

        {/* LMS */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('playerConfig.section.lms')}</Text>

        <form.Field name="lmsEntityId">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('playerConfig.field.lmsEntityId.label')}</Text>
              <EntityPicker
                value={field.state.value}
                onChangeValue={field.handleChange}
                onBlur={field.handleBlur}
                domain="media_player."
                label={t('playerConfig.field.lmsEntityId.label')}
                placeholder={t('playerConfig.field.lmsEntityId.placeholder')}
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
                {isSubmitting ? t('playerConfig.saving') : t('playerConfig.save')}
              </Text>
            </Pressable>
          )}
        </form.Subscribe>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
        >
          <Text style={styles.deleteButtonText}>{t('playerConfig.removePlayer')}</Text>
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
