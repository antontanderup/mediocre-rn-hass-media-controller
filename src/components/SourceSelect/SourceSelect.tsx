import React from 'react';
import { BottomSheetSelect } from '@/components/BottomSheetSelect';
import { Button, ButtonIcon, ButtonText } from '@/components/Button';
import { useMediaPlayerControls } from '@/hooks';
import { getSourceIcon } from '@/utils';
import { t } from '@/localization';

export interface SourceSelectProps {
  entityId: string;
  source: string;
  sourceList: string[];
}

export const SourceSelect = ({ entityId, source, sourceList }: SourceSelectProps) => {
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
        <Button
          variant="surface"
          size="sm"
          onPress={onOpen}
          accessibilityLabel={t('sourceSelect.selectSource')}
        >
          <ButtonIcon name={getSourceIcon(source)} />
          <ButtonText numberOfLines={1} style={{ flexShrink: 1, maxWidth: 160 }}>
            {source}
          </ButtonText>
          <ButtonIcon name="chevron-down" />
        </Button>
      )}
    />
  );
};
