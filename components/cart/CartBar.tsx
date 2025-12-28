import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/restaurant';

export default function CartBar() {
  const router = useRouter();
  const { totalItems, totalAmount, restaurantName } = useCart();

  if (totalItems === 0) return null;

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
    >
      <TouchableOpacity 
        style={styles.bar} 
        onPress={() => router.push('/cart')}
        activeOpacity={0.9}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.itemCount}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.restaurant} numberOfLines={1}>{restaurantName}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>{formatPrice(totalAmount)}</Text>
          <Text style={styles.viewCart}>View Cart</Text>
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
    paddingBottom: spacing.lg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    backgroundColor: colors.white,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...textStyles.labelSmall,
    color: colors.success,
    fontWeight: '700',
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  itemCount: {
    ...textStyles.labelSmall,
    color: colors.white,
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
    color: colors.white,
    marginRight: spacing.sm,
  },
  viewCart: {
    ...textStyles.labelSmall,
    color: colors.white,
    marginRight: spacing.xs,
  },
});
