import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Pressable
        style={[styles.settingsButton, { backgroundColor: theme.surfaceContainer }]}
        onPress={() => router.push('/settings')}
        accessibilityLabel="Open settings"
        accessibilityRole="button"
      >
        <Text style={[styles.settingsIcon, { color: theme.onSurfaceVariant }]}>⚙</Text>
      </Pressable>
      <Text style={[styles.placeholder, { color: theme.onSurfaceVariant }]}>
        No players yet.{'\n'}Configure your Home Assistant instance in settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  placeholder: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
});
