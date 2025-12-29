import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useCart, ItemAssignment } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/restaurant';
import { createOrder, updateOrderPayment, markOrderPaymentFailed } from '../services/orders';
import { updateOwedAmount } from '../services/friends';
import RazorpayService from '../services/razorpay';
import { Button } from '../components/ui';

interface Friend {
  id: string;
  name: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, restaurantId, restaurantName, totalAmount, clearCart, updateAssignments, getSplitSummary } = useCart();
  const { customer, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.back();
    }
  }, [items.length, orderPlaced]);

  // "Me" + friends list
  const allPeople: Friend[] = [
    { id: 'me', name: customer?.name || 'Me' },
    ...(customer?.friends || []),
  ];

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handlePlaceOrder = async () => {
    if (!customer || !user) {
      Alert.alert('Error', 'Please login to place order');
      return;
    }
    if (!restaurantId || !restaurantName) {
      Alert.alert('Error', 'Restaurant information missing');
      return;
    }

    setLoading(true);
    let createdOrderId: string | null = null;
    let createdOrderNumber: string | null = null;

    try {
      const orderItems = items.map(item => {
        const base: any = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: item.isVeg ?? true,
        };
        if (item.assignments && item.assignments.length > 0) {
          base.assignments = item.assignments;
        }
        return base;
      });

      const orderData: any = {
        customerId: user.uid,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        restaurantId,
        restaurantName,
        items: orderItems,
        totalAmount,
      };

      if (splitEnabled) {
        orderData.splitSummary = getSplitSummary(customer.name);
      }

      const orderResult = await createOrder(orderData);

      if (!orderResult.success || !orderResult.id) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      createdOrderId = orderResult.id;
      createdOrderNumber = orderResult.orderNumber!;

      const paymentResponse = await RazorpayService.openPayment({
        amount: RazorpayService.toPaisa(totalAmount),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9999999999',
        description: `Order #${createdOrderNumber} at ${restaurantName}`,
      });

      const updateResult = await updateOrderPayment(
        createdOrderId,
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id
      );
      console.log('Payment update result:', updateResult);

      // Update money owed for friends if split enabled
      if (splitEnabled && customer.id) {
        const split = getSplitSummary(customer.name);
        // Get friend IDs from assignments
        const friendOwes: Record<string, number> = {};
        items.forEach(item => {
          item.assignments?.forEach(a => {
            if (a.friendId !== 'me') {
              friendOwes[a.friendId] = (friendOwes[a.friendId] || 0) + (item.price * a.quantity);
            }
          });
        });
        // Update each friend's owed amount
        for (const [friendId, amount] of Object.entries(friendOwes)) {
          await updateOwedAmount(friendId, customer.id, customer.name, amount);
        }
      }

      setOrderPlaced(true);
      router.replace(`/order/${createdOrderId}`);
      setTimeout(() => clearCart(), 100);

    } catch (error: any) {
      if (createdOrderId) {
        await markOrderPaymentFailed(createdOrderId, error.message);
      }
      if (error.message === 'Payment cancelled') {
        Alert.alert('Payment Cancelled', 'Your order was not placed. Please try again.');
      } else {
        router.push(`/payment-failed?reason=${encodeURIComponent(error.message || 'Payment could not be completed')}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const openSplitModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowSplitModal(true);
  };

  const handleAssign = (friendId: string, friendName: string) => {
    if (!selectedItem) return;
    
    const currentAssignments = selectedItem.assignments || [];
    const existing = currentAssignments.find(a => a.friendId === friendId);
    const totalAssigned = currentAssignments.reduce((sum, a) => sum + a.quantity, 0);
    
    if (totalAssigned >= selectedItem.quantity && !existing) {
      Alert.alert('All assigned', 'All quantities are already assigned');
      return;
    }

    let newAssignments: ItemAssignment[];
    if (existing) {
      // Increment or remove if at max
      if (existing.quantity >= selectedItem.quantity) {
        newAssignments = currentAssignments.filter(a => a.friendId !== friendId);
      } else {
        newAssignments = currentAssignments.map(a =>
          a.friendId === friendId ? { ...a, quantity: a.quantity + 1 } : a
        );
      }
    } else {
      newAssignments = [...currentAssignments, { friendId, friendName, quantity: 1 }];
    }

    // Validate total doesn't exceed item quantity
    const newTotal = newAssignments.reduce((sum, a) => sum + a.quantity, 0);
    if (newTotal > selectedItem.quantity) {
      return;
    }

    updateAssignments(selectedItem.id, newAssignments);
  };

  const getAssignmentCount = (itemId: string, friendId: string): number => {
    const item = items.find(i => i.id === itemId);
    return item?.assignments?.find(a => a.friendId === friendId)?.quantity || 0;
  };

  const splitSummary = splitEnabled ? getSplitSummary(customer?.name || 'Me') : {};

  if (items.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Your Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Your Details</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{customer?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{customer?.phone || 'Not provided'}</Text>
          </View>
        </View>

        {/* Split Bill Toggle - Debug: Always show for testing */}
        {console.log('DEBUG: customer friends:', customer?.friends, 'length:', customer?.friends?.length)}
        {true && (
          <TouchableOpacity 
            style={styles.splitToggle} 
            onPress={() => setSplitEnabled(!splitEnabled)}
          >
            <View style={styles.splitToggleLeft}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.splitToggleText}>
                Split bill with friends {customer?.friends ? `(${customer.friends.length})` : '(0)'}
              </Text>
            </View>
            <View style={[styles.toggle, splitEnabled && styles.toggleActive]}>
              <View style={[styles.toggleDot, splitEnabled && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>{restaurantName}</Text>
          </View>
          {items.map(item => (
            <View key={item.id} style={styles.orderItemContainer}>
              <View style={styles.orderItem}>
                <View style={[styles.vegIndicator, item.isVeg ? styles.vegVeg : styles.vegNonVeg]}>
                  <View style={[styles.vegDot, item.isVeg ? styles.dotVeg : styles.dotNonVeg]} />
                </View>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
              
              {splitEnabled && (
                <TouchableOpacity 
                  style={styles.assignButton}
                  onPress={() => openSplitModal(item.id)}
                >
                  {item.assignments && item.assignments.length > 0 ? (
                    <Text style={styles.assignedText}>
                      {item.assignments.map(a => `${a.friendName} (${a.quantity})`).join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.assignText}>Tap to assign</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Bill Split Summary */}
        {splitEnabled && Object.keys(splitSummary).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.sectionTitle}>Bill Split</Text>
            </View>
            {Object.entries(splitSummary).map(([name, amount]) => (
              <View key={name} style={styles.splitRow}>
                <Text style={styles.splitName}>{name}</Text>
                <Text style={styles.splitAmount}>{formatPrice(amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Payment</Text>
          </View>
          <View style={styles.paymentOption}>
            <View style={styles.paymentIcon}>
              <Ionicons name="phone-portrait" size={24} color={colors.primary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>UPI / Google Pay</Text>
              <Text style={styles.paymentDesc}>Pay using any UPI app</Text>
            </View>
            <View style={styles.radioSelected}>
              <View style={styles.radioDot} />
            </View>
          </View>
        </View>

        {/* Total */}
        <View style={styles.section}>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title={loading ? 'Placing Order...' : `Pay ${formatPrice(totalAmount)}`}
          onPress={handlePlaceOrder}
          disabled={loading}
          fullWidth
        />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Placing your order...</Text>
        </View>
      )}

      {/* Assignment Modal */}
      <Modal visible={showSplitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign: {selectedItem?.name}</Text>
              <TouchableOpacity onPress={() => setShowSplitModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Quantity: {selectedItem?.quantity} • Tap to assign
            </Text>
            
            <View style={styles.peopleList}>
              {allPeople.map(person => {
                const count = selectedItem ? getAssignmentCount(selectedItem.id, person.id) : 0;
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[styles.personRow, count > 0 && styles.personRowActive]}
                    onPress={() => handleAssign(person.id, person.name)}
                  >
                    <View style={styles.personAvatar}>
                      <Text style={styles.personAvatarText}>{person.name.charAt(0)}</Text>
                    </View>
                    <Text style={styles.personName}>{person.name}</Text>
                    {count > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>{count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <Button title="Done" onPress={() => setShowSplitModal(false)} fullWidth />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
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
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary },
  section: { backgroundColor: colors.white, marginTop: spacing.sm, padding: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary, marginLeft: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailLabel: { ...textStyles.body, color: colors.textSecondary },
  detailValue: { ...textStyles.label, color: colors.textPrimary },
  splitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  splitToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  splitToggleText: { ...textStyles.label, color: colors.textPrimary },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    padding: 2,
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleDotActive: { transform: [{ translateX: 22 }] },
  orderItemContainer: { marginBottom: spacing.sm },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  vegIndicator: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  vegVeg: { borderColor: colors.veg },
  vegNonVeg: { borderColor: colors.nonVeg },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  dotVeg: { backgroundColor: colors.veg },
  dotNonVeg: { backgroundColor: colors.nonVeg },
  orderItemName: { ...textStyles.body, color: colors.textPrimary, flex: 1, marginLeft: spacing.sm },
  orderItemQty: { ...textStyles.body, color: colors.textSecondary, marginHorizontal: spacing.md },
  orderItemPrice: { ...textStyles.label, color: colors.textPrimary },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray50,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  assignText: { ...textStyles.caption, color: colors.textTertiary },
  assignedText: { ...textStyles.caption, color: colors.primary, flex: 1 },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  splitName: { ...textStyles.body, color: colors.textPrimary },
  splitAmount: { ...textStyles.label, color: colors.success },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.lg,
  },
  paymentIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1, marginLeft: spacing.md },
  paymentName: { ...textStyles.label, color: colors.textPrimary },
  paymentDesc: { ...textStyles.caption, color: colors.textSecondary },
  radioSelected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  billTotal: { borderTopWidth: 0, paddingTop: 0, marginTop: 0 },
  totalLabel: { ...textStyles.h4, color: colors.textPrimary },
  totalValue: { ...textStyles.h3, color: colors.success },
  footer: { padding: spacing.lg, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray100 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...textStyles.body, color: colors.textSecondary, marginTop: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { ...textStyles.h4, color: colors.textPrimary },
  modalSubtitle: { ...textStyles.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  peopleList: { marginBottom: spacing.lg },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.gray50,
  },
  personRowActive: { backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary },
  personAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { ...textStyles.label, color: colors.white },
  personName: { ...textStyles.body, color: colors.textPrimary, flex: 1, marginLeft: spacing.md },
  countBadge: { backgroundColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
  countText: { ...textStyles.caption, color: colors.white, fontWeight: '600' },
});
