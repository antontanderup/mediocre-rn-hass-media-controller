import { useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetSelect, Button, ButtonIcon, ButtonText, HaSearch, MaSearch } from '@/components';
import { useHassContext } from '@/context';
import { useSearchProvider, useSelectedPlayer } from '@/hooks';
import type { SearchProvider } from '@/hooks';
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

function providerKey(p: SearchProvider): string {
  return p.type === 'ha' ? `ha:${p.entityId}` : `ma:${p.maEntityId}`;
}

export default function SearchTab(): React.JSX.Element {
  const { entityId } = useSelectedPlayer();
  const styles = useStyles();
  const { hassConfig } = useHassContext();
  const navigation = useNavigation();

  const { providers, selected: selectedProvider, select: selectProvider } =
    useSearchProvider(entityId ?? '');

  const hasMultipleProviders = providers.length > 1;
  const activeKey = selectedProvider ? providerKey(selectedProvider) : '';
  const activeLabel = selectedProvider?.name ?? activeKey;

  const options = useMemo(
    () => providers.map(p => ({ value: providerKey(p), label: p.name })),
    [providers],
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
          value={activeKey}
          onChange={value => {
            const provider = providers.find(p => providerKey(p) === value);
            if (provider) selectProvider(provider);
          }}
          title={t('search.searchProvider')}
          renderTrigger={onOpen => (
            <Button
              variant="surface"
              size="sm"
              shape="chip"
              onPress={onOpen}
              accessibilityLabel={t('search.selectSearchProvider')}
              style={{ marginRight: 8 }}
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
    activeKey,
    activeLabel,
    providers,
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

  if (selectedProvider?.type === 'ma') {
    return (
      <View style={styles.container}>
        <MaSearch maEntityId={selectedProvider.maEntityId} />
      </View>
    );
  }

  const hassBaseUrl = buildHassUrl(hassConfig);
  const haEntityId = selectedProvider?.type === 'ha' ? selectedProvider.entityId : (entityId ?? '');

  return (
    <View style={styles.container}>
      <HaSearch entityId={haEntityId} hassBaseUrl={hassBaseUrl} />
    </View>
  );
}
