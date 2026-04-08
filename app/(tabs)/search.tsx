import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetSelect, HaSearch, Icon } from '@/components';
import { useHassContext } from '@/context';
import { useSearchProvider, useSelectedPlayer, useTheme } from '@/hooks';
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  headerRightLabel: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    maxWidth: 120,
  },
}));

export default function SearchTab(): React.JSX.Element {
  const { entityId } = useSelectedPlayer();
  const theme = useTheme();
  const styles = useStyles();
  const { hassConfig } = useHassContext();
  const navigation = useNavigation();

  const { providers, selected: selectedProvider, select: selectProvider } =
    useSearchProvider(entityId ?? '');

  const haProviders = useMemo(
    () => providers.filter(p => p.type === 'ha'),
    [providers],
  );
  const hasMultipleProviders = haProviders.length > 1;

  const activeEntityId =
    selectedProvider?.type === 'ha' ? selectedProvider.entityId : (entityId ?? '');
  const activeLabel =
    haProviders.find(p => p.type === 'ha' && p.entityId === activeEntityId)?.name ??
    activeEntityId;

  const options = useMemo(
    () =>
      haProviders.map(p => ({
        value: p.type === 'ha' ? p.entityId : '',
        label: p.name,
      })),
    [haProviders],
  );

  useLayoutEffect(() => {
    if (!hasMultipleProviders) {
      navigation.setOptions({ headerRight: undefined });
      return;
    }
    navigation.setOptions({
      headerRight: () => (
        <BottomSheetSelect
          options={options}
          value={activeEntityId}
          onChange={value => {
            const provider = haProviders.find(
              p => p.type === 'ha' && p.entityId === value,
            );
            if (provider) selectProvider(provider);
          }}
          title="Search provider"
          renderTrigger={onOpen => (
            <Pressable
              style={styles.headerRight}
              onPress={onOpen}
              accessibilityRole="button"
              accessibilityLabel="Select search provider"
            >
              <Text style={styles.headerRightLabel} numberOfLines={1}>
                {activeLabel}
              </Text>
              <Icon name="chevron-down" size={18} color={theme.onSurfaceVariant} />
            </Pressable>
          )}
        />
      ),
    });
  }, [
    navigation,
    hasMultipleProviders,
    options,
    activeEntityId,
    activeLabel,
    haProviders,
    selectProvider,
    styles,
    theme,
  ]);

  if (!entityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Select a player to search</Text>
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
      <HaSearch entityId={activeEntityId} hassBaseUrl={hassBaseUrl} />
    </View>
  );
}
