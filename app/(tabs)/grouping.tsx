import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Icon, VolumeSlider } from '@/components';
import { useActivePlayer, useHassContext } from '@/context';
import { useAppConfig, useGrouping, useTheme } from '@/hooks';
import type { GroupableSpeaker } from '@/hooks';
import { createUseStyles } from '@/utils';
import type { MediaPlayerEntity, MediaPlayerState } from '@/types';

type ConfiguredPlayer = { player: MediaPlayerEntity; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATE_LABELS: Record<MediaPlayerState, string> = {
  playing: 'Playing',
  paused: 'Paused',
  idle: 'Idle',
  off: 'Off',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
  standby: 'Standby',
  buffering: 'Playing',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GroupingTab() {
  const { activePlayerId, setActivePlayerId } = useActivePlayer();
  const entityId = activePlayerId ?? '';
  const theme = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { players } = useHassContext();
  const { config: appConfig } = useAppConfig();

  const { groupedSpeakers, ungroupedSpeakers, hasGroupableEntities, toggleGroup, setVolume, setMuted } =
    useGrouping(entityId);

  const [syncMainSpeakerVolume, setSyncMainSpeakerVolume] = useState(true);

  const handleVolumeChange = useCallback(
    (speaker: GroupableSpeaker, volume: number) => {
      setVolume(speaker.entityId, volume);
      if (speaker.isMainSpeaker && syncMainSpeakerVolume) {
        groupedSpeakers.filter(s => !s.isMainSpeaker).forEach(s => setVolume(s.entityId, volume));
      }
    },
    [setVolume, syncMainSpeakerVolume, groupedSpeakers],
  );

  const disablePlayerFocusSwitching = appConfig?.options.disablePlayerFocusSwitching ?? false;

  const configuredPlayers = useMemo(() => {
    const configured = appConfig?.mediaPlayers;
    if (!configured?.length) {
      return players.map(p => ({
        player: p,
        name: p.attributes.friendly_name ?? p.entity_id,
      }));
    }
    return configured
      .map(cfg => {
        const player = players.find(p => p.entity_id === cfg.entityId);
        if (!player) return null;
        return {
          player,
          name: cfg.name ?? player.attributes.friendly_name ?? cfg.entityId,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [players, appConfig]);

  if (!activePlayerId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
          Select a player from the Players tab.
        </Text>
      </View>
    );
  }

  const showEmpty = !hasGroupableEntities && disablePlayerFocusSwitching;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Join speakers ───────────────────────────────────────────────────── */}
      {hasGroupableEntities && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitles}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Join speakers</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.onSurfaceVariant }]}>
                Manage which speakers play together
              </Text>
            </View>
            <Pressable
              style={styles.syncToggle}
              onPress={() => setSyncMainSpeakerVolume((v: boolean) => !v)}
              accessibilityLabel="Link volume"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: syncMainSpeakerVolume }}
            >
              <Text style={[styles.syncText, { color: theme.onSurfaceVariant }]}>Link volume</Text>
              <Icon
                name={syncMainSpeakerVolume ? 'checkbox-circle-line' : 'checkbox-blank-circle-line'}
                size={18}
                color={syncMainSpeakerVolume ? theme.primary : theme.onSurfaceVariant}
              />
            </Pressable>
          </View>

          {/* Grouped speakers — volume + leave */}
          <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
            {groupedSpeakers.map((speaker, i) => (
              <View key={speaker.entityId}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />}
                <View style={styles.speakerRow}>
                  <Text
                    style={[
                      styles.speakerName,
                      { color: theme.onSurface },
                      speaker.isMainSpeaker && styles.speakerNameBold,
                    ]}
                    numberOfLines={1}
                  >
                    {speaker.name}
                  </Text>
                  {speaker.isOff ? (
                    <Pressable
                      onPress={() => toggleGroup(speaker.entityId, false)}
                      style={styles.iconBtn}
                      accessibilityLabel="Turn on"
                    >
                      <Icon name="shut-down-line" size={18} color={theme.onSurfaceVariant} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setMuted(speaker.entityId, speaker.isMuted)}
                      style={styles.iconBtn}
                      accessibilityLabel={speaker.isMuted ? 'Unmute' : 'Mute'}
                    >
                      <Icon
                        name={speaker.isMuted ? 'volume-mute-line' : 'volume-up-line'}
                        size={18}
                        color={theme.onSurfaceVariant}
                      />
                    </Pressable>
                  )}
                  <View style={styles.sliderWrap}>
                    <VolumeSlider
                      volume={speaker.volume}
                      onVolumeChange={(v: number) => handleVolumeChange(speaker, v)}
                    />
                  </View>
                  <Pressable
                    onPress={() => toggleGroup(speaker.entityId, speaker.isGrouped)}
                    style={styles.iconBtn}
                    disabled={speaker.isMainSpeaker || speaker.isLoading}
                    accessibilityLabel="Remove from group"
                  >
                    {speaker.isLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Icon
                        name="close-line"
                        size={18}
                        color={speaker.isMainSpeaker ? theme.outlineVariant : theme.onSurfaceVariant}
                      />
                    )}
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Ungrouped speaker chips — tap to join */}
          {ungroupedSpeakers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsRow}
              contentContainerStyle={styles.chipsContent}
            >
              {ungroupedSpeakers.map(speaker => (
                <Pressable
                  key={speaker.entityId}
                  style={[
                    styles.chip,
                    { backgroundColor: theme.surfaceContainer, borderColor: theme.outline },
                  ]}
                  onPress={() => toggleGroup(speaker.entityId, false)}
                  disabled={speaker.isLoading}
                  accessibilityLabel={`Add ${speaker.name}`}
                >
                  {speaker.isLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Icon name="add-line" size={14} color={theme.primary} />
                  )}
                  <Text style={[styles.chipText, { color: theme.onSurface }]}>{speaker.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* ── Switch player ───────────────────────────────────────────────────── */}
      {!disablePlayerFocusSwitching && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitles}>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Switch player</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.onSurfaceVariant }]}>
                Focus a different player
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
            {configuredPlayers.map((item: ConfiguredPlayer, i: number) => {
              const isActive = item.player.entity_id === entityId;
              return (
                <View key={item.player.entity_id}>
                  {i > 0 && (
                    <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />
                  )}
                  <Pressable
                    style={styles.playerRow}
                    onPress={() => {
                      if (!isActive) {
                        setActivePlayerId(item.player.entity_id);
                        router.push('/(tabs)/player');
                      }
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Icon
                      name={isActive ? 'radio-button-line' : 'circle-line'}
                      size={18}
                      color={isActive ? theme.primary : theme.onSurfaceVariant}
                    />
                    <Text
                      style={[
                        styles.playerName,
                        { color: theme.onSurface },
                        isActive && styles.playerNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.playerState, { color: theme.onSurfaceVariant }]}>
                      {STATE_LABELS[item.player.state] ?? item.player.state}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {showEmpty && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
            No speakers configured for grouping. Mark players as groupable in Settings → Media
            Players.
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitles: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  syncToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
  },
  syncText: {
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  speakerName: {
    flex: 1,
    fontSize: 14,
  },
  speakerNameBold: {
    fontWeight: '600',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWrap: {
    flex: 2,
  },
  chipsRow: {
    flexShrink: 0,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
  },
  playerNameActive: {
    fontWeight: '600',
  },
  playerState: {
    fontSize: 12,
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
