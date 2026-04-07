import { Text, View } from 'react-native';
import { HaMediaBrowser } from '@/components';
import { useHassContext } from '@/context';
import { useSelectedPlayer, useTheme } from '@/hooks';
import { buildHassUrl, createUseStyles } from '@/utils';

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
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

export default function BrowserTab() {
  const { entityId, config: playerConfig } = useSelectedPlayer();
  useTheme();
  const styles = useStyles();
  const { hassConfig } = useHassContext();

  if (!entityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Select a player to browse media</Text>
      </View>
    );
  }

  if (!hassConfig) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Not connected to Home Assistant</Text>
      </View>
    );
  }

  const hassBaseUrl = buildHassUrl(hassConfig);

  return (
    <View style={styles.container}>
      <HaMediaBrowser
        entityId={entityId}
        hassBaseUrl={hassBaseUrl}
        mediaBrowserEntries={playerConfig?.mediaBrowserEntries}
      />
    </View>
  );
}
