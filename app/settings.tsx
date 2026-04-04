import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useHassConfig, useTheme } from '@/hooks';
import { useThemeContext } from '@/context';
import type { HassConfig } from '@/types';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function SettingsScreen() {
  const theme = useTheme();
  const { setSourceColor } = useThemeContext();
  const { config, saveConfig } = useHassConfig();
  const router = useRouter();

  const [host, setHost] = useState(config?.host ?? '');
  const [port, setPort] = useState(String(config?.port ?? 8123));
  const [ssl, setSsl] = useState(config?.ssl ?? false);
  const [token, setToken] = useState(config?.token ?? '');
  const [sourceColorInput, setSourceColorInput] = useState(theme.sourceColor);
  const [error, setError] = useState<string | null>(null);

  const isValidHex = HEX_RE.test(sourceColorInput);

  const handleSave = async () => {
    if (!host.trim()) {
      setError('Host is required.');
      return;
    }
    if (!token.trim()) {
      setError('Token is required.');
      return;
    }
    setError(null);

    const cfg: HassConfig = {
      host: host.trim(),
      port: parseInt(port, 10) || 8123,
      ssl,
      token: token.trim(),
    };

    await saveConfig(cfg);
    if (isValidHex) {
      setSourceColor(sourceColorInput);
    }
    router.back();
  };

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

        <View style={styles.field}>
          <Text style={styles.label}>Host / IP</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            placeholder="192.168.1.100"
            placeholderTextColor={theme.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Port</Text>
          <TextInput
            style={styles.input}
            value={port}
            onChangeText={setPort}
            placeholder="8123"
            placeholderTextColor={theme.onSurfaceVariant}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Use SSL (wss://)</Text>
          <Switch
            value={ssl}
            onValueChange={setSsl}
            trackColor={{ true: theme.primary, false: theme.surfaceVariant }}
            thumbColor={ssl ? theme.onPrimary : theme.onSurfaceVariant}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Long-lived access token</Text>
          <TextInput
            style={[styles.input, styles.tokenInput]}
            value={token}
            onChangeText={setToken}
            placeholder="eyJ..."
            placeholderTextColor={theme.onSurfaceVariant}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Appearance</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Source color (hex)</Text>
          <View style={styles.colorRow}>
            <TextInput
              style={[styles.input, styles.colorInput]}
              value={sourceColorInput}
              onChangeText={setSourceColorInput}
              placeholder="#6750A4"
              placeholderTextColor={theme.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={7}
            />
            <View
              style={[
                styles.swatch,
                { backgroundColor: isValidHex ? sourceColorInput : theme.surfaceVariant },
              ]}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    errorText: {
      color: theme.error,
      fontSize: 14,
      marginBottom: 16,
    },
    saveButton: {
      marginTop: 8,
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      color: theme.onPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
