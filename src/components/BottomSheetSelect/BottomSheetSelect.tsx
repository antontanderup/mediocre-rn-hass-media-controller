import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks';
import { createUseStyles } from '@/utils';
import { Icon } from '@/components/Icon';
import type { BottomSheetSelectProps } from './BottomSheetSelect.types';

export const BottomSheetSelect = <T extends string = string>({
  options,
  value,
  onChange,
  title,
  renderTrigger,
}: BottomSheetSelectProps<T>): React.JSX.Element => {
  const styles = useStyles();
  const theme = useTheme();
  const sheetRef = useRef<TrueSheet>(null);
  const [hasOpened, setHasOpened] = useState(false);

  const handleOpen = useCallback(() => {
    sheetRef.current?.present();
    setHasOpened(true);
  }, []);

  const handleDidDismiss = useCallback(() => {
    setHasOpened(false);
  }, []);

  const handleSelect = useCallback(
    (option: T) => {
      onChange(option);
      sheetRef.current?.dismiss();
    },
    [onChange],
  );

  return (
    <>
      {renderTrigger(handleOpen)}
      {hasOpened && (
        <TrueSheet
          ref={sheetRef}
          detents={['auto']}
          cornerRadius={16}
          initialDetentIndex={0}
          grabber
          onDidDismiss={handleDidDismiss}
          backgroundColor={theme.surfaceContainerLow}
        >
          <View style={styles.content}>
            {title && <Text style={styles.title}>{title}</Text>}
            <View style={styles.optionList}>
              {options.map(option => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(option.value)}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    {option.icon && (
                      <Icon
                        name={option.icon}
                        size={20}
                        color={isSelected ? theme.onPrimaryContainer : theme.onSurfaceVariant}
                      />
                    )}
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Icon name="check" size={18} color={theme.onPrimaryContainer} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </TrueSheet>
      )}
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = createUseStyles(theme => ({
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  optionList: {
    gap: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
  },
  optionSelected: {
    backgroundColor: theme.primaryContainer,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: theme.onSurface,
  },
  optionLabelSelected: {
    color: theme.onPrimaryContainer,
    fontWeight: '600',
  },
}));
