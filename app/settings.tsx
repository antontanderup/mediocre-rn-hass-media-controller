import { type } from 'arktype';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
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
import { useHassContext, useThemeContext } from '@/context';
import { useAppConfig, useTheme } from '@/hooks';
import { Icon } from '@/components';
import type { AppConfig, AppOptions, HassConfig } from '@/types';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';

// ─── Validation schema ────────────────────────────────────────────────────────

const settingsSchema = type({
  host: 'string >= 1',
  port: 'string',
  ssl: 'boolean',
  token: 'string >= 1',
  sourceColor: 'string',
});

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const theme = useTheme();
  const { setSourceColor } = useThemeContext();
  const { hassConfig: config, saveConfig } = useHassContext();
  const { config: appConfig, saveConfig: saveAppConfig } = useAppConfig();
  const router = useRouter();
  const styles = useStyles();
  const { error } = useLocalSearchParams<{ error?: string }>();
  const showInvalidTokenError = error === 'invalid_token';

  const form = useForm({
    defaultValues: {
      host: config?.host ?? '',
      port: String(config?.port ?? 8123),
      ssl: config?.ssl ?? false,
      token: config?.token ?? '',
      sourceColor: theme.sourceColor,
      useArtColors: appConfig?.options.useArtColors ?? false,
      disablePlayerFocusSwitching: appConfig?.options.disablePlayerFocusSwitching ?? false,
      playerIsActiveWhen: appConfig?.options.playerIsActiveWhen ?? ('playing' as AppOptions['playerIsActiveWhen']),
      showVolumeStepButtons: appConfig?.options.showVolumeStepButtons ?? false,
    },
    onSubmit: async ({ value }) => {
      const result = settingsSchema(value);
      if (result instanceof type.errors) {
        // Surface the first validation error — field-level validators catch
        // most issues before submit, but this is a safety net.
        return;
      }

      const cfg: HassConfig = {
        host: result.host.trim(),
        port: parseInt(result.port, 10) || 8123,
        ssl: result.ssl,
        token: result.token.trim(),
      };

      const newAppConfig: AppConfig = {
        mediaPlayers: appConfig?.mediaPlayers ?? [],
        options: {
          useArtColors: value.useArtColors,
          disablePlayerFocusSwitching: value.disablePlayerFocusSwitching,
          playerIsActiveWhen: value.playerIsActiveWhen,
          showVolumeStepButtons: value.showVolumeStepButtons,
        },
      };

      await Promise.all([saveConfig(cfg), saveAppConfig(newAppConfig)]);

      if (HEX_RE.test(result.sourceColor)) {
        setSourceColor(result.sourceColor);
      }
      router.back();
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {showInvalidTokenError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>
              {t('settings.invalidToken')}
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>{t('settings.section.homeAssistant')}</Text>

        {/* Host */}
        <form.Field
          name="host"
          validators={{
            onChange: ({ value }) =>
              settingsSchema.get('host')(value) instanceof type.errors
                ? t('settings.field.host.required')
                : undefined,
          }}
        >
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('settings.field.host.label')}</Text>
              <TextInput
                style={[
                  styles.input,
                  field.state.meta.errors.length > 0 && styles.inputError,
                ]}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={t('settings.field.host.placeholder')}
                placeholderTextColor={theme.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              {field.state.meta.errors.length > 0 && (
                <Text style={styles.fieldError}>{field.state.meta.errors[0]}</Text>
              )}
            </View>
          )}
        </form.Field>

        {/* Port */}
        <form.Field name="port">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('settings.field.port.label')}</Text>
              <TextInput
                style={styles.input}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={t('settings.field.port.placeholder')}
                placeholderTextColor={theme.onSurfaceVariant}
                keyboardType="number-pad"
              />
            </View>
          )}
        </form.Field>

        {/* SSL toggle */}
        <form.Field name="ssl">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>{t('settings.field.ssl.label')}</Text>
              <Switch
                value={field.state.value}
                onValueChange={field.handleChange}
                trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
                thumbColor={field.state.value ? theme.onPrimary : theme.onSurfaceVariant}
              />
            </View>
          )}
        </form.Field>

        {/* Token */}
        <form.Field
          name="token"
          validators={{
            onChange: ({ value }) =>
              settingsSchema.get('token')(value) instanceof type.errors
                ? t('settings.field.token.required')
                : undefined,
          }}
        >
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('settings.field.token.label')}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.tokenInput,
                  field.state.meta.errors.length > 0 && styles.inputError,
                ]}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={t('settings.field.token.placeholder')}
                placeholderTextColor={theme.onSurfaceVariant}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {field.state.meta.errors.length > 0 && (
                <Text style={styles.fieldError}>{field.state.meta.errors[0]}</Text>
              )}
            </View>
          )}
        </form.Field>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('settings.section.appearance')}</Text>

        {/* Source color */}
        <form.Field name="sourceColor">
          {field => {
            const isValidHex = HEX_RE.test(field.state.value);
            return (
              <View style={styles.field}>
                <Text style={styles.label}>{t('settings.field.sourceColor.label')}</Text>
                <View style={styles.colorRow}>
                  <TextInput
                    style={[styles.input, styles.colorInput]}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    placeholder={t('settings.field.sourceColor.placeholder')}
                    placeholderTextColor={theme.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={7}
                  />
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: isValidHex
                          ? field.state.value
                          : theme.surfaceVariant,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          }}
        </form.Field>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('settings.section.appOptions')}</Text>

        {/* Use art colors */}
        <form.Field name="useArtColors">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>{t('settings.option.useArtColors')}</Text>
              <Switch
                value={field.state.value}
                onValueChange={field.handleChange}
                trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
                thumbColor={field.state.value ? theme.onPrimary : theme.onSurfaceVariant}
              />
            </View>
          )}
        </form.Field>

        {/* Show volume step buttons */}
        <form.Field name="showVolumeStepButtons">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>{t('settings.option.showVolumeStepButtons')}</Text>
              <Switch
                value={field.state.value}
                onValueChange={field.handleChange}
                trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
                thumbColor={field.state.value ? theme.onPrimary : theme.onSurfaceVariant}
              />
            </View>
          )}
        </form.Field>

        {/* Disable player focus switching */}
        <form.Field name="disablePlayerFocusSwitching">
          {field => (
            <View style={styles.row}>
              <Text style={styles.label}>{t('settings.option.disablePlayerFocusSwitching')}</Text>
              <Switch
                value={field.state.value}
                onValueChange={field.handleChange}
                trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
                thumbColor={field.state.value ? theme.onPrimary : theme.onSurfaceVariant}
              />
            </View>
          )}
        </form.Field>

        {/* Player is active when */}
        <form.Field name="playerIsActiveWhen">
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>{t('settings.field.playerIsActiveWhen.label')}</Text>
              <View style={styles.segmentedControl}>
                <Pressable
                  style={[
                    styles.segment,
                    field.state.value === 'playing' && styles.segmentActive,
                  ]}
                  onPress={() => field.handleChange('playing')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      field.state.value === 'playing' && styles.segmentTextActive,
                    ]}
                  >
                    {t('settings.field.playerIsActiveWhen.playing')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.segment,
                    field.state.value === 'playing_or_paused' && styles.segmentActive,
                  ]}
                  onPress={() => field.handleChange('playing_or_paused')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      field.state.value === 'playing_or_paused' && styles.segmentTextActive,
                    ]}
                  >
                    {t('settings.field.playerIsActiveWhen.playingOrPaused')}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </form.Field>

        {/* Media Players — navigation link */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>{t('settings.section.mediaPlayers')}</Text>
        <Pressable
          style={styles.navRow}
          onPress={() => router.push('/media-players')}
          accessibilityRole="button"
        >
          <Text style={styles.navRowText}>{t('settings.mediaPlayers.configure')}</Text>
          <Icon name="chevron-right" size={20} color={theme.onSurfaceVariant} />
        </Pressable>

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <Pressable
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={form.handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? t('settings.saving') : t('settings.save')}
              </Text>
            </Pressable>
          )}
        </form.Subscribe>
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
    errorBanner: {
      backgroundColor: theme.errorContainer,
      borderRadius: 10,
      padding: 14,
      marginBottom: 20,
    },
    errorBannerText: {
      color: theme.onErrorContainer,
      fontSize: 14,
      lineHeight: 20,
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
    inputError: {
      borderColor: theme.error,
    },
    tokenInput: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    colorInput: {
      flex: 1,
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.outline,
    },
    fieldError: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
    },
    segmentedControl: {
      flexDirection: 'row',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.outline,
      overflow: 'hidden',
    },
    segment: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: theme.surfaceContainer,
    },
    segmentActive: {
      backgroundColor: theme.primaryContainer,
    },
    segmentText: {
      fontSize: 14,
      color: theme.onSurfaceVariant,
    },
    segmentTextActive: {
      color: theme.onPrimaryContainer,
      fontWeight: '600',
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surfaceContainer,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.outlineVariant,
    },
    navRowText: {
      fontSize: 15,
      color: theme.onSurface,
    },
    saveButton: {
      marginTop: 8,
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
}));
