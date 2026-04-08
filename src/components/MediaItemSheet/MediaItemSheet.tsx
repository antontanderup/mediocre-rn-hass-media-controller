import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { MediaItemSheetProps } from './MediaItemSheet.types';

const ART_SIZE = 56;

export const MediaItemSheet = ({
  artworkUrl,
  title,
  artist,
  actions,
  renderTrigger,
}: MediaItemSheetProps): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpen = useCallback(() => {
    sheetRef.current?.present();
    setHasOpened(true);
  }, []);

  const handleAction = useCallback(
    (onPress: () => void) => {
      sheetRef.current?.dismiss();
      onPress();
    },
    [],
  );

  return (
    <>
      {renderTrigger(handleOpen)}
      { hasOpened && (
        <TrueSheet
        ref={sheetRef}
        detents={['auto']}
        cornerRadius={16}
        grabber
        initialDetentIndex={0}
        backgroundColor={theme.surfaceContainerLow}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.artwork}>
              {artworkUrl ? (
                <Image
                  source={{ uri: artworkUrl }}
                  style={imageStyles.artwork}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon name="music-note" size={28} color={theme.onSurfaceVariant} />
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {!!artist && (
                <Text style={styles.artist} numberOfLines={1}>
                  {artist}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.actionList}>
            {actions.map(action => (
              <Pressable
                key={action.label}
                style={styles.action}
                onPress={() => handleAction(action.onPress)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <Icon name={action.icon} size={22} color={theme.onSurface} />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </TrueSheet>
          )}
    </>
  );
};

const imageStyles = StyleSheet.create({
  artwork: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 8,
  },
});

const useStyles = createUseStyles(theme => ({
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  artwork: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 8,
    backgroundColor: theme.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
  },
  artist: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: theme.surfaceContainerHigh,
    marginTop: 8,
  },
  actionList: {
    gap: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.onSurface,
  },
}));
