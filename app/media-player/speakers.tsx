import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useHassEntities } from '@/context';
import { useAppConfig, useSelectedPlayer, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';
import { PlayerCardItem } from '../_components/PlayerCardItem';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SpeakersTab() {
  const { entityId, setSelectedPlayer } = useSelectedPlayer();
  const theme = useTheme();
  const styles = useStyles();
  const { players } = useHassEntities();
  const { config: appConfig } = useAppConfig();

  const disablePlayerFocusSwitching = appConfig?.options.disablePlayerFocusSwitching ?? false;

  const configuredPlayers = useMemo(() => {
    const configured = appConfig?.mediaPlayers;
    if (!configured?.length) {
      return players.map(p => ({
        player: p,
        name: p.attributes.friendly_name ?? p.entity_id,
        isChildInGroup: false,
        numPlayersInGroup: 0,
      }));
    }
    return configured
      .map(cfg => {
        const player = players.find(p => p.entity_id === cfg.entityId);
        if (!player) return null;
        const groupEntityId = cfg.speakerGroupEntityId ?? cfg.entityId;
        const groupPlayer = players.find(p => p.entity_id === groupEntityId);
        const groupMembers = groupPlayer?.attributes.group_members ?? [];
        const isChildInGroup =
          groupMembers.length > 1 && groupMembers[0] !== groupEntityId;
        const numPlayersInGroup = groupMembers.length;
        return {
          player,
          name: cfg.name ?? player.attributes.friendly_name ?? cfg.entityId,
          isChildInGroup,
          numPlayersInGroup,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [players, appConfig]);

  const showEmpty = disablePlayerFocusSwitching;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Switch player ───────────────────────────────────────────────────── */}
      {!disablePlayerFocusSwitching && (
        <>
          {configuredPlayers.map(item => {
            if (item.isChildInGroup) return null;
            const isActive = item.player.entity_id === entityId;
            const groupSuffix = item.numPlayersInGroup > 1 ? ` +${item.numPlayersInGroup - 1}` : '';
            const baseName = item.name !== (item.player.attributes.friendly_name ?? item.player.entity_id)
              ? item.name
              : undefined;
            const displayName = baseName
              ? `${baseName}${groupSuffix}`
              : groupSuffix
                ? `${item.player.attributes.friendly_name ?? item.player.entity_id}${groupSuffix}`
                : undefined;
            return (
              <PlayerCardItem
                key={item.player.entity_id}
                player={item.player}
                nameOverride={displayName}
                isActive={isActive}
                onPress={() => {
                  if (!isActive) {
                    setSelectedPlayer(item.player.entity_id);
                  }
                }}
              />
            );
          })}
        </>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {showEmpty && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
            {t('speakers.empty')}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}));
