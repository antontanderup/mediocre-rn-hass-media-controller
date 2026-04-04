import { type } from 'arktype';
import { useRouter } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useThemeContext } from '@/context';
import { useHassConfig, useTheme } from '@/hooks';
import type { HassConfig } from '@/types';

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
  const { config, saveConfig } = useHassConfig();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      host: config?.host ?? '',
      port: String(config?.port ?? 8123),
      ssl: config?.ssl ?? false,
      token: config?.token ?? '',
      sourceColor: theme.sourceColor,
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

      await saveConfig(cfg);
      if (HEX_RE.test(result.sourceColor)) {
        setSourceColor(result.sourceColor);
      }
      router.back();
    },
  });

  const styles = makeStyles(theme);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Home Assistant</Text>

        {/* Host */}
        <form.Field
          name="host"
          validators={{
            onChange: ({ value }) =>
              settingsSchema.get('host')(value) instanceof type.errors
                ? 'Host is required'
                : undefined,
          }}
        >
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>Host / IP</Text>
              <TextInput
                style={[
                  styles.input,
                  field.state.meta.errors.length > 0 && styles.inputError,
                ]}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="192.168.1.100"
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
              <Text style={styles.label}>Port</Text>
              <TextInput
                style={styles.input}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="8123"
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
              <Text style={styles.label}>Use SSL (wss://)</Text>
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
                ? 'Token is required'
                : undefined,
          }}
        >
          {field => (
            <View style={styles.field}>
              <Text style={styles.label}>Long-lived access token</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.tokenInput,
                  field.state.meta.errors.length > 0 && styles.inputError,
                ]}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="eyJ..."
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

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Appearance</Text>

        {/* Source color */}
        <form.Field name="sourceColor">
          {field => {
            const isValidHex = HEX_RE.test(field.state.value);
            return (
              <View style={styles.field}>
                <Text style={styles.label}>Source color (hex)</Text>
                <View style={styles.colorRow}>
                  <TextInput
                    style={[styles.input, styles.colorInput]}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    placeholder="#6750A4"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
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
  });
