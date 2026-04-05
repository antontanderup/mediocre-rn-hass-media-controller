import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.background,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    color: theme.onSurfaceVariant,
  },
}));

export default function SearchTab() {
  useLocalSearchParams<{ entityId?: string }>();
  useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Search & Browse — coming soon</Text>
    </View>
  );
}
