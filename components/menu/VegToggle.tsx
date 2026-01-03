import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import * as Haptics from 'expo-haptics';

export type VegFilter = 'all' | 'veg' | 'nonveg';

interface VegToggleProps {
  value: VegFilter;
  onChange: (value: VegFilter) => void;
  compact?: boolean;
}

export function VegToggle({ value, onChange, compact = false }: VegToggleProps) {
  const colors = useColors();

  const handlePress = (newValue: VegFilter) => {
    if (newValue !== value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(newValue);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray100 }]}>
      <TouchableOpacity
        style={[
          styles.option,
          compact && styles.optionCompact,
          value === 'veg' && { backgroundColor: colors.successLight }
        ]}
        onPress={() => handlePress('veg')}
        activeOpacity={0.7}
      >
        <View style={[styles.indicator, { borderColor: colors.veg }]}>
          <View style={[styles.dot, { backgroundColor: colors.veg }]} />
        </View>
        {!compact && <Text style={[styles.label, { color: value === 'veg' ? colors.veg : colors.textSecondary }]}>Veg</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          compact && styles.optionCompact,
          value === 'all' && { backgroundColor: colors.white }
        ]}
        onPress={() => handlePress('all')}
        activeOpacity={0.7}
      >
        <Ionicons name="grid-outline" size={14} color={value === 'all' ? colors.textPrimary : colors.textTertiary} />
        {!compact && <Text style={[styles.label, { color: value === 'all' ? colors.textPrimary : colors.textSecondary }]}>Both</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.option,
          compact && styles.optionCompact,
          value === 'nonveg' && { backgroundColor: colors.errorLight }
        ]}
        onPress={() => handlePress('nonveg')}
        activeOpacity={0.7}
      >
        <View style={[styles.indicator, { borderColor: colors.nonVeg }]}>
          <View style={[styles.dot, { backgroundColor: colors.nonVeg }]} />
        </View>
        {!compact && <Text style={[styles.label, { color: value === 'nonveg' ? colors.nonVeg : colors.textSecondary }]}>Non-veg</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  optionCompact: {
    paddingHorizontal: spacing.sm,
  },
  indicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    ...textStyles.labelSmall,
  },
});
