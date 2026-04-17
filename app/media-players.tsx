import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useHassEntities } from '@/context';
import { useAppConfig, useTheme } from '@/hooks';
import { Icon } from '@/components';
import type { AppConfig, MediaPlayerConfig } from '@/types';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';

// ─── Component ────────────────────────────────────────────────────────────────

export default function MediaPlayersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const styles = useStyles();
  const { config, saveConfig } = useAppConfig();
  const { players: hassPlayers } = useHassEntities();
  const [showPicker, setShowPicker] = useState(false);

  const configuredPlayers = config?.mediaPlayers ?? [];

  const availableToAdd = hassPlayers.filter(
    p => !configuredPlayers.some(c => c.entityId === p.entity_id),
  );

  const persistPlayers = async (updated: MediaPlayerConfig[]): Promise<void> => {
    const newConfig: AppConfig = {
      mediaPlayers: updated,
      options: config?.options ?? {},
    };
    await saveConfig(newConfig);
  };

  const handleDelete = (index: number): void => {
    const updated = configuredPlayers.filter((_, i) => i !== index);
    persistPlayers(updated).catch(() => {});
  };

  const handleMoveUp = (index: number): void => {
    if (index === 0) return;
    const updated = [...configuredPlayers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    persistPlayers(updated).catch(() => {});
  };

  const handleMoveDown = (index: number): void => {
    if (index === configuredPlayers.length - 1) return;
    const updated = [...configuredPlayers];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    persistPlayers(updated).catch(() => {});
  };

  const handleAddPlayer = (entityId: string): void => {
    const newPlayer: MediaPlayerConfig = { entityId };
    const updated = [...configuredPlayers, newPlayer];
    const newIndex = updated.length - 1;
    persistPlayers(updated)
      .then(() => {
        setShowPicker(false);
        router.push(`/media-players/${newIndex}`);
      })
      .catch(() => {});
  };

  const handleAddAll = (): void => {
    const toAdd: MediaPlayerConfig[] = availableToAdd.map(p => ({ entityId: p.entity_id }));
    const updated = [...configuredPlayers, ...toAdd];
    persistPlayers(updated).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {configuredPlayers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t('mediaPlayers.empty.title')}</Text>
          <Text style={styles.emptyText}>{t('mediaPlayers.empty.description')}</Text>
        </View>
      ) : (
        <FlatList
          data={configuredPlayers}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const hassPlayer = hassPlayers.find(p => p.entity_id === item.entityId);
            const displayName = item.name ?? hassPlayer?.attributes.friendly_name ?? item.entityId;
            return (
            <View style={styles.playerRow}>
              <View style={styles.reorderButtons}>
                <Pressable
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                  accessibilityLabel={t('mediaPlayers.action.moveUp')}
                  accessibilityRole="button"
                >
                  <Icon name="chevron-up" size={18} color={theme.onSurfaceVariant} />
                </Pressable>
                <Pressable
                  onPress={() => handleMoveDown(index)}
                  disabled={index === configuredPlayers.length - 1}
                  style={[
                    styles.reorderBtn,
                    index === configuredPlayers.length - 1 && styles.reorderBtnDisabled,
                  ]}
                  accessibilityLabel={t('mediaPlayers.action.moveDown')}
                  accessibilityRole="button"
                >
                  <Icon name="chevron-down" size={18} color={theme.onSurfaceVariant} />
                </Pressable>
              </View>

              <View style={styles.playerInfo}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.playerEntityId} numberOfLines={1}>{item.entityId}</Text>
              </View>

              <Pressable
                style={styles.iconButton}
                onPress={() => router.push(`/media-players/${index}`)}
                accessibilityLabel={t('mediaPlayers.action.edit')}
                accessibilityRole="button"
              >
                <Icon name="pencil" size={18} color={theme.onSurfaceVariant} />
              </Pressable>

              <Pressable
                style={styles.iconButton}
                onPress={() => handleDelete(index)}
                accessibilityLabel={t('mediaPlayers.action.delete')}
                accessibilityRole="button"
              >
                <Icon name="delete" size={18} color={theme.error} />
              </Pressable>
            </View>
            );
          }}
        />
      )}

      <View style={styles.actionsBar}>
        {hassPlayers.length === 0 ? (
          <Text style={styles.noHassText}>{t('mediaPlayers.notConnected')}</Text>
        ) : availableToAdd.length === 0 ? (
          <Text style={styles.noHassText}>{t('mediaPlayers.allConfigured')}</Text>
        ) : (
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.addButton}
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
            >
              <Icon name="plus" size={18} color={theme.onPrimary} />
              <Text style={styles.addButtonText}>{t('mediaPlayers.addPlayer')}</Text>
            </Pressable>
            {availableToAdd.length > 1 && (
              <Pressable
                style={styles.addAllButton}
                onPress={handleAddAll}
                accessibilityRole="button"
              >
                <Text style={styles.addAllButtonText}>{t('mediaPlayers.addAll', { count: availableToAdd.length })}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={showPicker}
        presentationStyle="formSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('mediaPlayers.modal.title')}</Text>
            <Pressable
              onPress={() => setShowPicker(false)}
              accessibilityLabel={t('mediaPlayers.modal.close')}
              accessibilityRole="button"
            >
              <Icon name="close" size={24} color={theme.onSurface} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.pickerList}>
            {availableToAdd.map(p => (
              <Pressable
                key={p.entity_id}
                style={styles.pickerRow}
                onPress={() => handleAddPlayer(p.entity_id)}
                accessibilityRole="button"
              >
                <Text style={styles.pickerName} numberOfLines={1}>
                  {p.attributes.friendly_name ?? p.entity_id}
                </Text>
                <Text style={styles.pickerEntityId} numberOfLines={1}>{p.entity_id}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceContainer,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  reorderBtn: {
    padding: 4,
    borderRadius: 4,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 8,
    marginRight: 4,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.onSurface,
  },
  playerEntityId: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  actionsBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.outlineVariant,
    backgroundColor: theme.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addButtonText: {
    color: theme.onPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  addAllButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.secondaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
  },
  addAllButtonText: {
    color: theme.onSecondaryContainer,
    fontSize: 15,
    fontWeight: '600',
  },
  noHassText: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.onSurface,
  },
  pickerList: {
    paddingVertical: 8,
  },
  pickerRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
  },
  pickerName: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.onSurface,
  },
  pickerEntityId: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
    marginTop: 2,
  },
}));
