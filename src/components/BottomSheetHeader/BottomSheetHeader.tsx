import React from 'react';
import { Text, View } from 'react-native';
import { createUseStyles } from '@/utils';
import type { BottomSheetHeaderProps } from './BottomSheetHeader.types';

export const BottomSheetHeader = ({
  title,
  subtitle,
  children,
}: BottomSheetHeaderProps): React.JSX.Element => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
};

const useStyles = createUseStyles(theme => ({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  subtitle: {
    fontSize: 12,
    color: theme.onSurfaceVariant,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
}));
