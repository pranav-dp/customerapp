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
import { TreatRoom } from '../../services/treatMode';

interface Props {
  treatRoom?: TreatRoom | null;
}

export default function CartBar({ treatRoom }: Props) {
  const router = useRouter();
  const colors = useColors();
  const { totalItems, totalAmount, restaurantName } = useCart();

  const hasTreatItems = treatRoom && treatRoom.cart.length > 0;
  const hasPersonalItems = totalItems > 0;

  if (!hasPersonalItems && !hasTreatItems) return null;

  return (
    <Animated.View 
      style={styles.container}
      entering={FadeInDown.duration(200)}
      exiting={FadeOutDown.duration(200)}
    >
      {/* Treat Cart Bar */}
      {hasTreatItems && (
        <TouchableOpacity 
          style={[styles.bar, styles.treatBar, { backgroundColor: colors.warning }, shadows.lg]} 
          onPress={() => router.push(`/treat-room/${treatRoom.id}` as any)}
          activeOpacity={0.9}
        >
          <View style={styles.left}>
            <View style={[styles.badge, { backgroundColor: colors.white }]}>
              <Ionicons name="gift" size={14} color={colors.warning} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.itemCount, { color: colors.white }]}>
                Treat · {treatRoom.cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </Text>
              <Text style={styles.restaurant} numberOfLines={1}>{treatRoom.restaurantName}</Text>
            </View>
          </View>
          <View style={styles.right}>
            <Text style={[styles.total, { color: colors.white }]}>₹{treatRoom.totalAmount}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
      )}

      {/* Personal Cart Bar */}
      {hasPersonalItems && (
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
      )}
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
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  treatBar: {
    paddingVertical: spacing.sm,
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
