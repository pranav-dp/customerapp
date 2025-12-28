import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { RestaurantStatus } from '../../utils/restaurant';

interface ClosedBannerProps {
  status: RestaurantStatus;
}

export default function ClosedBanner({ status }: ClosedBannerProps) {
  if (status.isOpen) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="time-outline" size={20} color={colors.white} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Restaurant is closed</Text>
        <Text style={styles.message}>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray800,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...textStyles.label,
    color: colors.white,
  },
  message: {
    ...textStyles.bodySmall,
    color: colors.gray400,
    marginTop: 2,
  },
});
