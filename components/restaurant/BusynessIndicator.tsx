import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { BusynessLevel } from '../../services/busyness';

interface BusynessIndicatorProps {
  level: BusynessLevel;
  label: string;
  waitTime?: number | null;
  compact?: boolean;
}

export function BusynessIndicator({ level, label, waitTime, compact = false }: BusynessIndicatorProps) {
  const colors = useColors();
  
  const levelColors = {
    low: colors.success,
    medium: colors.warning,
    high: colors.error
  };
  
  const bgColors = {
    low: colors.successLight,
    medium: colors.warningLight,
    high: colors.errorLight
  };
  
  const color = levelColors[level];
  const bgColor = bgColors[level];

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: bgColor }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.compactLabel, { color }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      {waitTime && (
        <Text style={[styles.waitTime, { color: colors.textSecondary }]}>
          ~{waitTime} min wait
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...textStyles.labelSmall,
  },
  waitTime: {
    ...textStyles.caption,
    marginTop: 2,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  compactLabel: {
    ...textStyles.caption,
  },
});
