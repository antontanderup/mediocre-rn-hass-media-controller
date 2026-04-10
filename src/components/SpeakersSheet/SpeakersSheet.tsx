import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { useGrouping, useHaptics, useSelectedPlayer, useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import type { SpeakersSheetProps } from './SpeakersSheet.types';

export const SpeakersSheet = ({ entityId }: SpeakersSheetProps): React.JSX.Element | null => {
  const theme = useTheme();
  const styles = useStyles();
  const haptics = useHaptics();
  const sheetRef = useRef<TrueSheet>(null);
  const [hasOpened, setHasOpened] = useState(false);

  const { allSpeakers, hasGroupableEntities } = useGrouping(entityId);
  const { entityId: selectedEntityId, setSelectedPlayer } = useSelectedPlayer();

  const handleOpen = useCallback(() => {
    haptics.light();
    sheetRef.current?.present();
    setHasOpened(true);
  }, [haptics]);

  const handleDidDismiss = useCallback(() => {
    setHasOpened(false);
  }, []);

  const handleSelectSpeaker = useCallback(
    (configEntityId: string) => {
      setSelectedPlayer(configEntityId);
      sheetRef.current?.dismiss();
    },
    [setSelectedPlayer],
  );

  if (!hasGroupableEntities) return null;

  const connectedCount = allSpeakers.filter(s => s.isGrouped && !s.isMainSpeaker).length;

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={connectedCount > 0 ? `Speakers, ${connectedCount} connected` : 'Speakers'}
      >
        <Icon name="speaker-multiple" size={18} color={theme.onSurfaceVariant} />
        {connectedCount > 0 && (
          <Text style={styles.badgeText}>{connectedCount}</Text>
        )}
      </Pressable>

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
              <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Speakers</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surfaceContainer }]}>
              {allSpeakers.map((speaker, i) => {
                const isSelected = speaker.configEntityId === selectedEntityId;
                const subtitle = speaker.mediaTitle ?? (speaker.isOff ? 'Off' : speaker.state);
                return (
                  <View key={speaker.entityId}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: theme.outlineVariant }]} />}
                    <Pressable
                      style={styles.speakerRow}
                      onPress={() => handleSelectSpeaker(speaker.configEntityId)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={speaker.name}
                    >
                      <View style={styles.speakerInfo}>
                        <Text
                          style={[
                            styles.speakerName,
                            { color: isSelected ? theme.primary : theme.onSurface },
                            isSelected && styles.speakerNameBold,
                          ]}
                          numberOfLines={1}
                        >
                          {speaker.name}
                        </Text>
                        <Text
                          style={[styles.speakerSubtitle, { color: theme.onSurfaceVariant }]}
                          numberOfLines={1}
                        >
                          {subtitle}
                        </Text>
                      </View>
                      <Icon
                        name={isSelected ? 'check-circle' : 'radiobox-blank'}
                        size={20}
                        color={isSelected ? theme.primary : theme.outlineVariant}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </TrueSheet>
      )}
    </>
  );
};

const useStyles = createUseStyles(theme => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHigh,
  },
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
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    paddingVertical: 12,
    gap: 12,
  },
  speakerInfo: {
    flex: 1,
    gap: 2,
  },
  speakerName: {
    fontSize: 14,
  },
  speakerNameBold: {
    fontWeight: '600',
  },
  speakerSubtitle: {
    fontSize: 12,
  },
}));
