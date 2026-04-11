import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, ButtonIcon } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { VolumeSlider } from '@/components/VolumeSlider';
import { useGrouping, useHaptics, useMediaPlayerControls, useTheme } from '@/hooks';
import type { GroupableSpeaker } from '@/hooks';
import { createUseStyles } from '@/utils';
import { t } from '@/localization';
import type { SpeakersSheetProps } from './SpeakersSheet.types';

export const SpeakersSheet = ({ entityId }: SpeakersSheetProps): React.JSX.Element | null => {
  const theme = useTheme();
  const styles = useStyles();
  const haptics = useHaptics();
  const sheetRef = useRef<TrueSheet>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const [syncMainSpeakerVolume, setSyncMainSpeakerVolume] = useState(true);

  const { groupedSpeakers, ungroupedSpeakers, hasGroupableEntities, toggleGroup, setVolume, setMuted } =
    useGrouping(entityId);
  const controls = useMediaPlayerControls(entityId);

  const handleOpen = useCallback(() => {
    haptics.light();
    sheetRef.current?.present();
    setHasOpened(true);
  }, [haptics]);

  const handleDidDismiss = useCallback(() => {
    setHasOpened(false);
  }, []);

  const handleVolumeChange = useCallback(
    (speaker: GroupableSpeaker, volume: number) => {
      if (speaker.isMainSpeaker && syncMainSpeakerVolume) {
        controls.setVolume(volume, true);
      } else {
        setVolume(speaker.entityId, volume);
      }
    },
    [controls, setVolume, syncMainSpeakerVolume],
  );

  if (!hasGroupableEntities) return null;

  const connectedCount = groupedSpeakers.length - 1;

  return (
    <>
      <Button
        variant="surface"
        size="sm"
        onPress={handleOpen}
        accessibilityLabel={
          connectedCount > 0
            ? t('speakersSheet.speakersConnected', { count: connectedCount })
            : t('speakersSheet.speakers')
        }
      >
        <ButtonIcon name="speaker-multiple" />
        {connectedCount > 0 && (
          <Text style={styles.badgeText}>{connectedCount}</Text>
        )}
      </Button>

      {hasOpened && (
        <TrueSheet
          ref={sheetRef}
          detents={['auto']}
          cornerRadius={16}
          grabber
          initialDetentIndex={0}
          onDidDismiss={handleDidDismiss}
          backgroundColor={theme.surfaceContainerLow}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.headerTitles}>
                <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
                  {t('speakers.joinSpeakers')}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.onSurfaceVariant }]}>
                  {t('speakers.manageSpeakers')}
                </Text>
              </View>
              <Pressable
                style={styles.syncToggle}
                onPress={() => setSyncMainSpeakerVolume(v => !v)}
                accessibilityLabel={t('speakers.linkVolume')}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: syncMainSpeakerVolume }}
              >
                <Text style={[styles.syncText, { color: theme.onSurfaceVariant }]}>
                  {t('speakers.linkVolume')}
                </Text>
                <Icon
                  name={syncMainSpeakerVolume ? 'check-circle' : 'radiobox-blank'}
                  size={18}
                  color={syncMainSpeakerVolume ? theme.primary : theme.onSurfaceVariant}
                />
              </Pressable>
            </View>

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
                        accessibilityLabel={t('speakers.turnOn')}
                      >
                        <Icon name="power" size={18} color={theme.onSurfaceVariant} />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => setMuted(speaker.entityId, speaker.isMuted)}
                        style={styles.iconBtn}
                        accessibilityLabel={speaker.isMuted ? t('speakers.unmute') : t('speakers.mute')}
                      >
                        <Icon
                          name={speaker.isMuted ? 'volume-mute' : 'volume-high'}
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
                      accessibilityLabel={t('speakers.removeFromGroup')}
                    >
                      {speaker.isLoading ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <Icon
                          name="close"
                          size={18}
                          color={speaker.isMainSpeaker ? theme.outlineVariant : theme.onSurfaceVariant}
                        />
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {ungroupedSpeakers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
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
                    accessibilityLabel={t('speakers.addSpeaker', { name: speaker.name })}
                  >
                    {speaker.isLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Icon name="plus" size={14} color={theme.primary} />
                    )}
                    <Text style={[styles.chipText, { color: theme.onSurface }]}>{speaker.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </TrueSheet>
      )}
    </>
  );
};

const useStyles = createUseStyles(theme => ({
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  headerSubtitle: {
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
}));
