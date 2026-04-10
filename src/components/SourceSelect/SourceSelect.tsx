import React from 'react';
import { Pressable, Text } from 'react-native';
import { BottomSheetSelect } from '@/components/BottomSheetSelect';
import { Icon } from '@/components/Icon';
import { useMediaPlayerControls, useTheme } from '@/hooks';
import { createUseStyles, getSourceIcon } from '@/utils';
import { t } from '@/localization';

export interface SourceSelectProps {
  entityId: string;
  source: string;
  sourceList: string[];
}

export const SourceSelect = ({ entityId, source, sourceList }: SourceSelectProps) => {
  const theme = useTheme();
  const styles = useStyles();
  const { setSource } = useMediaPlayerControls(entityId);

  const options = sourceList.map(s => ({
    value: s,
    label: s,
    icon: getSourceIcon(s),
  }));

  return (
    <BottomSheetSelect
      options={options}
      value={source}
      onChange={setSource}
      title={t('sourceSelect.title')}
      renderTrigger={onOpen => (
        <Pressable
          style={styles.trigger}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={t('sourceSelect.selectSource')}
        >
          <Icon name={getSourceIcon(source)} size={18} color={theme.onSurfaceVariant} />
          <Text style={styles.label} numberOfLines={1}>
            {source}
          </Text>
          <Icon name="chevron-down" size={16} color={theme.onSurfaceVariant} />
        </Pressable>
      )}
    />
  );
};

const useStyles = createUseStyles(theme => ({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerHigh,
  },
  label: {
    fontSize: 13,
    color: theme.onSurfaceVariant,
    flexShrink: 1,
    maxWidth: 160,
  },
}));
