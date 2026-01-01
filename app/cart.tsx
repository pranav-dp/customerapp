import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useCart, CartItem } from '../contexts/CartContext';
import { useColors } from '../hooks/useColors';
import { formatPrice } from '../utils/restaurant';
import { Button } from '../components/ui';

function CartItemRow({ item, onIncrease, onDecrease, onRemove, colors }: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.itemRow, { borderBottomColor: colors.gray100 }]}>
      <View style={[styles.vegIndicator, { borderColor: item.isVeg ? colors.veg : colors.nonVeg }]}>
        <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.veg : colors.nonVeg }]} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>{formatPrice(item.price)}</Text>
      </View>
      <View style={[styles.quantityControl, { backgroundColor: colors.white, borderColor: colors.success }]}>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={item.quantity === 1 ? onRemove : onDecrease}
        >
          <Ionicons 
            name={item.quantity === 1 ? 'trash-outline' : 'remove'} 
            size={16} 
            color={colors.success} 
          />
        </TouchableOpacity>
        <Text style={[styles.quantity, { color: colors.success }]}>{item.quantity}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={colors.success} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.itemTotal, { color: colors.textPrimary }]}>{formatPrice(item.price * item.quantity)}</Text>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const colors = useColors();
  const { items, restaurantName, totalAmount, updateQuantity, removeItem, clearCart } = useCart();

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
        <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cart</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="cart-outline" size={64} color={colors.gray300} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add items from a restaurant to get started</Text>
          <Button title="Browse Restaurants" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cart</Text>
        <TouchableOpacity onPress={handleClearCart} style={styles.backButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={[styles.restaurantInfo, { backgroundColor: colors.white }]}>
          <Ionicons name="restaurant-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{restaurantName}</Text>
        </View>

        {/* Cart Items */}
        <View style={[styles.itemsContainer, { backgroundColor: colors.white }]}>
          {items.map(item => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
              onRemove={() => removeItem(item.id)}
              colors={colors}
            />
          ))}
        </View>

        {/* Bill Details */}
        <View style={[styles.billContainer, { backgroundColor: colors.white }]}>
          <Text style={[styles.billTitle, { color: colors.textPrimary }]}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Item Total</Text>
            <Text style={[styles.billValue, { color: colors.textPrimary }]}>{formatPrice(totalAmount)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Platform Fee</Text>
            <Text style={[styles.billValue, { color: colors.textPrimary }]}>{formatPrice(0)}</Text>
          </View>
          <View style={[styles.billRow, styles.billTotal, { borderTopColor: colors.gray200 }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>To Pay</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={[styles.checkoutContainer, { backgroundColor: colors.white, borderTopColor: colors.gray100 }]}>
        <View style={styles.checkoutInfo}>
          <Text style={[styles.checkoutTotal, { color: colors.textPrimary }]}>{formatPrice(totalAmount)}</Text>
          <Text style={[styles.checkoutLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <Button title="Proceed to Checkout" onPress={handleCheckout} style={styles.checkoutButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h2,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...textStyles.body,
    textAlign: 'center',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  restaurantName: {
    ...textStyles.label,
    marginLeft: spacing.sm,
  },
  itemsContainer: {
    paddingHorizontal: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...textStyles.label,
  },
  itemPrice: {
    ...textStyles.bodySmall,
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    padding: spacing.sm,
  },
  quantity: {
    ...textStyles.label,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    ...textStyles.label,
    minWidth: 60,
    textAlign: 'right',
  },
  billContainer: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  billTitle: {
    ...textStyles.h4,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  billLabel: {
    ...textStyles.body,
  },
  billValue: {
    ...textStyles.body,
  },
  billTotal: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...textStyles.h4,
  },
  totalValue: {
    ...textStyles.h4,
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  checkoutInfo: {
    marginRight: spacing.lg,
  },
  checkoutTotal: {
    ...textStyles.h3,
  },
  checkoutLabel: {
    ...textStyles.caption,
  },
  checkoutButton: {
    flex: 1,
  },
});
