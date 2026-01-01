import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useCart } from '../../contexts/CartContext';
import { useColors } from '../../hooks/useColors';
import { formatPrice } from '../../utils/restaurant';

export default function CartBar() {
  const router = useRouter();
  const colors = useColors();
  const { totalItems, totalAmount, restaurantName } = useCart();

  if (totalItems === 0) return null;

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
    >
      <TouchableOpacity 
        style={[styles.bar, { backgroundColor: colors.success }, shadows.lg]} 
        onPress={() => router.push('/cart')}
        activeOpacity={0.9}
      >
        <View style={styles.left}>
          <View style={[styles.badge, { backgroundColor: colors.white }]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>{totalItems}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.itemCount, { color: colors.white }]}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.restaurant} numberOfLines={1}>{restaurantName}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.total, { color: colors.white }]}>{formatPrice(totalAmount)}</Text>
          <Text style={[styles.viewCart, { color: colors.white }]}>View Cart</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...textStyles.labelSmall,
    fontWeight: '700',
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  itemCount: {
    ...textStyles.labelSmall,
  },
  restaurant: {
    ...textStyles.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    ...textStyles.h4,
    marginRight: spacing.sm,
  },
  viewCart: {
    ...textStyles.labelSmall,
    marginRight: spacing.xs,
  },
});
