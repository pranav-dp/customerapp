import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { SuggestedCombo } from '../../services/suggestions';

interface Props {
  combo: SuggestedCombo;
  onAdd: () => void;
}

export function SuggestedComboCard({ combo, onAdd }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
      <View style={styles.header}>
        <Ionicons name="flash" size={16} color={colors.primary} />
        <Text style={[styles.title, { color: colors.primary }]}>Your Usual</Text>
      </View>
      <Text style={[styles.items, { color: colors.textPrimary }]} numberOfLines={1}>
        {combo.items.map(i => i.name).join(' + ')}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.textPrimary }]}>₹{combo.totalPrice}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={onAdd}>
          <Text style={styles.addBtnText}>Add All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  items: {
    ...textStyles.body,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...textStyles.h3,
  },
  addBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  addBtnText: {
    ...textStyles.caption,
    color: '#fff',
    fontWeight: '600',
  },
});
