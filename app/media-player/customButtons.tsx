import { Text, View } from 'react-native';
import { useSelectedPlayer, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';

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

export default function CustomButtonsTab() {
  useSelectedPlayer();
  useTheme();
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('customButtons.comingSoon')}</Text>
    </View>
  );
}
