import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';

interface BudgetTrackerProps {
  limit: number;
  spent: number;
  orderAmount: number;
  splitCount?: number;
}

export function BudgetTracker({ limit, spent, orderAmount, splitCount = 1 }: BudgetTrackerProps) {
  const colors = useColors();
  
  if (limit <= 0) return null;
  
  const yourShare = Math.ceil(orderAmount / splitCount);
  const remaining = limit - spent;
  const afterOrder = remaining - yourShare;
  const percentUsed = Math.min((spent / limit) * 100, 100);
  
  const isWarning = percentUsed >= 70 && percentUsed < 90;
  const isDanger = percentUsed >= 90 || afterOrder < 0;
  
  const barColor = isDanger ? colors.error : isWarning ? colors.warning : colors.success;
  const bgColor = isDanger ? colors.errorLight : isWarning ? colors.warningLight : colors.successLight;

  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="wallet-outline" size={16} color={barColor} />
          <Text style={[styles.title, { color: barColor }]}>{monthName} Budget</Text>
        </View>
        <Text style={[styles.remaining, { color: colors.textPrimary }]}>
          {remaining.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} left
        </Text>
      </View>
      
      <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
        <View style={[styles.progressFill, { width: `${percentUsed}%`, backgroundColor: barColor }]} />
      </View>
      
      <View style={styles.details}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Spent: {spent.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} / {limit.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
        </Text>
      </View>
      
      <View style={[styles.orderImpact, { borderTopColor: barColor + '30' }]}>
        <View style={styles.impactRow}>
          <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>This order</Text>
          <Text style={[styles.impactValue, { color: colors.textPrimary }]}>
            {splitCount > 1 ? `${yourShare.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} (your share)` : yourShare.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.impactRow}>
          <Text style={[styles.impactLabel, { color: colors.textSecondary }]}>After order</Text>
          <Text style={[styles.impactValue, { color: afterOrder < 0 ? colors.error : colors.textPrimary }]}>
            {afterOrder.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
          </Text>
        </View>
        {isDanger && (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={[styles.warningText, { color: colors.error }]}>
              {afterOrder < 0 ? 'Exceeds budget!' : 'Spend carefully'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...textStyles.labelSmall,
  },
  remaining: {
    ...textStyles.label,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  details: {
    marginTop: spacing.xs,
  },
  detailText: {
    ...textStyles.caption,
  },
  orderImpact: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  impactLabel: {
    ...textStyles.caption,
  },
  impactValue: {
    ...textStyles.labelSmall,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  warningText: {
    ...textStyles.caption,
  },
});
