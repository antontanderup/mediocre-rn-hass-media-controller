import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetSelect, Button, ButtonIcon, ButtonText, HaSearch } from '@/components';
import { useHassContext } from '@/context';
import { useSearchProvider, useSelectedPlayer } from '@/hooks';
import { buildHassUrl, createUseStyles } from '@/utils';
import { t } from '@/localization';

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

export default function SearchTab(): React.JSX.Element {
  const { entityId } = useSelectedPlayer();
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
          title={t('search.searchProvider')}
          renderTrigger={onOpen => (
            <Button
              variant="subtle"
              size="sm"
              onPress={onOpen}
              accessibilityLabel={t('search.selectSearchProvider')}
            >
              <ButtonText numberOfLines={1} style={{ maxWidth: 120 }}>
                {activeLabel}
              </ButtonText>
              <ButtonIcon name="chevron-down" />
            </Button>
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
  ]);

  if (!entityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>{t('search.selectPlayer')}</Text>
      </View>
    );
  }

  if (!hassConfig) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>{t('search.notConnected')}</Text>
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
