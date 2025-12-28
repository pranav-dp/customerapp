import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useCart, CartItem } from '../contexts/CartContext';
import { formatPrice } from '../utils/restaurant';
import { Button } from '../components/ui';

function CartItemRow({ item, onIncrease, onDecrease, onRemove }: {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <View style={[styles.vegIndicator, item.isVeg ? styles.vegIndicatorVeg : styles.vegIndicatorNonVeg]}>
        <View style={[styles.vegDot, item.isVeg ? styles.vegDotVeg : styles.vegDotNonVeg]} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
      </View>
      <View style={styles.quantityControl}>
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
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity style={styles.quantityButton} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={colors.success} />
        </TouchableOpacity>
      </View>
      <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={64} color={colors.gray300} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items from a restaurant to get started</Text>
          <Button title="Browse Restaurants" onPress={() => router.push('/(tabs)')} style={{ marginTop: spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity onPress={handleClearCart} style={styles.backButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Ionicons name="restaurant-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.restaurantName}>{restaurantName}</Text>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {items.map(item => (
            <CartItemRow
              key={item.id}
              item={item}
              onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.billContainer}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>{formatPrice(totalAmount)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>{formatPrice(0)}</Text>
          </View>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutTotal}>{formatPrice(totalAmount)}</Text>
          <Text style={styles.checkoutLabel}>Total</Text>
        </View>
        <Button title="Proceed to Checkout" onPress={handleCheckout} style={styles.checkoutButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    color: colors.textPrimary,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  restaurantName: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  itemsContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIndicatorVeg: { borderColor: colors.veg },
  vegIndicatorNonVeg: { borderColor: colors.nonVeg },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  vegDotVeg: { backgroundColor: colors.veg },
  vegDotNonVeg: { backgroundColor: colors.nonVeg },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  itemPrice: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    padding: spacing.sm,
  },
  quantity: {
    ...textStyles.label,
    color: colors.success,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    ...textStyles.label,
    color: colors.textPrimary,
    minWidth: 60,
    textAlign: 'right',
  },
  billContainer: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  billTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  billLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  billValue: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  billTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  totalValue: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  checkoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  checkoutInfo: {
    marginRight: spacing.lg,
  },
  checkoutTotal: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  checkoutLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  checkoutButton: {
    flex: 1,
  },
});
