import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';
import { RestaurantStatus } from '../../utils/restaurant';

interface ClosedBannerProps {
  status: RestaurantStatus;
}

export default function ClosedBanner({ status }: ClosedBannerProps) {
  const colors = useColors();
  
  if (status.isOpen) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.gray800 }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.gray700 }]}>
        <Ionicons name="time-outline" size={20} color={colors.white} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.white }]}>Restaurant is closed</Text>
        <Text style={[styles.message, { color: colors.gray400 }]}>{status.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...textStyles.label,
  },
  message: {
    ...textStyles.bodySmall,
    marginTop: 2,
  },
});
