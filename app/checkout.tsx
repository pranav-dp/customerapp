import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useCart, ItemAssignment } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../utils/restaurant';
import { createOrder, updateOrderPayment } from '../services/orders';
import { updateOwedAmount } from '../services/friends';
import { getBudget, addToSpent, Budget } from '../services/budget';
import { generateTimeSlots, TimeSlot } from '../services/scheduling';
import { BudgetTracker } from '../components/budget';
import { ScheduleToggle } from '../components/scheduling';
import RazorpayService from '../services/razorpay';
import { Button } from '../components/ui';

interface Friend {
  id: string;
  name: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { items, restaurantId, restaurantName, totalAmount, clearCart, updateAssignments, getSplitSummary } = useCart();
  const { customer, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const timeSlots = generateTimeSlots(); // TODO: pass restaurant operating hours

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      router.back();
    }
  }, [items.length, orderPlaced]);

  // Fetch budget
  useEffect(() => {
    const fetchBudget = async () => {
      if (!customer?.id) return;
      const result = await getBudget(customer.id);
      if (result.success && result.data) {
        setBudget(result.data);
      }
    };
    fetchBudget();
  }, [customer?.id]);

  // "Me" + friends list
  const allPeople: Friend[] = [
    { id: 'me', name: customer?.name || 'Me' },
    ...(customer?.friends?.filter(f => f.odid && f.odname).map(f => ({ id: f.odid, name: f.odname })) || []),
  ];

  const selectedItem = items.find(i => i.id === selectedItemId);
  const splitCount = splitEnabled ? Object.keys(getSplitSummary(customer?.name || 'Me')).length : 1;

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
        isScheduled: scheduleEnabled && selectedSlot !== null,
        scheduledFor: scheduleEnabled && selectedSlot ? selectedSlot.value : null,
      };

      if (splitEnabled) {
        orderData.splitSummary = getSplitSummary(customer.name);
      }

      // Payment FIRST
      const paymentResponse = await RazorpayService.openPayment({
        amount: RazorpayService.toPaisa(totalAmount),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9999999999',
        description: `Order at ${restaurantName}`,
      });

      // Only create order after successful payment
      const orderResult = await createOrder(orderData);

      if (!orderResult.success || !orderResult.id) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      createdOrderId = orderResult.id;
      createdOrderNumber = orderResult.orderNumber!;

      await updateOrderPayment(
        createdOrderId,
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_order_id
      );

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

      // Update budget spending tracker
      if (customer.id) {
        addToSpent(customer.id, totalAmount).catch(() => { });
      }

    } catch (error: any) {
      if (error.message === 'Payment cancelled') {
        Alert.alert('Payment Cancelled', 'Your order was not placed. Please try again.');
      } else {
        Alert.alert('Payment Failed', error.message || 'Payment could not be completed');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Checkout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Your Details */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Details</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Name</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{customer?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phone</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{customer?.phone || 'Not provided'}</Text>
          </View>
        </View>

        {/* Split Bill Toggle */}
        {(customer?.friends?.length ?? 0) > 0 && (
          <TouchableOpacity
            style={[styles.splitToggle, { backgroundColor: colors.white }]}
            onPress={() => setSplitEnabled(!splitEnabled)}
          >
            <View style={styles.splitToggleLeft}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={[styles.splitToggleText, { color: colors.textPrimary }]}>
                Split bill with friends {customer?.friends ? `(${customer.friends.length})` : '(0)'}
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: splitEnabled ? colors.primary : colors.gray200 }]}>
              <View style={[styles.toggleDot, { backgroundColor: colors.white, transform: [{ translateX: splitEnabled ? 22 : 0 }] }]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="restaurant-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{restaurantName}</Text>
          </View>
          {items.map(item => (
            <View key={item.id} style={styles.orderItemContainer}>
              <View style={styles.orderItem}>
                <View style={[styles.vegIndicator, { borderColor: item.isVeg ? colors.veg : colors.nonVeg }]}>
                  <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.veg : colors.nonVeg }]} />
                </View>
                <Text style={[styles.orderItemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.orderItemQty, { color: colors.textSecondary }]}>x{item.quantity}</Text>
                <Text style={[styles.orderItemPrice, { color: colors.textPrimary }]}>{formatPrice(item.price * item.quantity)}</Text>
              </View>

              {splitEnabled && (
                <TouchableOpacity
                  style={[styles.assignButton, { backgroundColor: colors.gray50 }]}
                  onPress={() => openSplitModal(item.id)}
                >
                  {item.assignments && item.assignments.length > 0 ? (
                    <Text style={[styles.assignedText, { color: colors.primary }]}>
                      {item.assignments.map(a => `${a.friendName} (${a.quantity})`).join(', ')}
                    </Text>
                  ) : (
                    <Text style={[styles.assignText, { color: colors.textTertiary }]}>Tap to assign</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Bill Split Summary */}
        {splitEnabled && Object.keys(splitSummary).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.white }]}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.gray100 }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.textPrimary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bill Split</Text>
            </View>
            {Object.entries(splitSummary).map(([name, amount]) => (
              <View key={name} style={[styles.splitRow, { borderBottomColor: colors.gray100 }]}>
                <Text style={[styles.splitName, { color: colors.textPrimary }]}>{name}</Text>
                <Text style={[styles.splitAmount, { color: colors.success }]}>{formatPrice(amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Payment */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.gray100 }]}>
            <Ionicons name="card-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment</Text>
          </View>
          <View style={[styles.paymentOption, { backgroundColor: colors.gray50 }]}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.white }]}>
              <Ionicons name="phone-portrait" size={24} color={colors.primary} />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentName, { color: colors.textPrimary }]}>UPI / Google Pay</Text>
              <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>Pay using any UPI app</Text>
            </View>
            <View style={[styles.radioSelected, { borderColor: colors.success }]}>
              <View style={[styles.radioDot, { backgroundColor: colors.success }]} />
            </View>
          </View>
        </View>

        {/* Schedule Order */}
        <View style={styles.budgetSection}>
          <ScheduleToggle
            enabled={scheduleEnabled}
            onToggle={(v) => { setScheduleEnabled(v); if (!v) setSelectedSlot(null); }}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            slots={timeSlots}
          />
        </View>

        {/* Budget Tracker */}
        {budget && budget.monthlyLimit > 0 && (
          <View style={styles.budgetSection}>
            <BudgetTracker
              limit={budget.monthlyLimit}
              spent={budget.spent}
              orderAmount={totalAmount}
              splitCount={splitCount}
            />
          </View>
        )}

        {/* Total */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.gray100 }]}>
        <Button
          title={loading ? 'Placing Order...' : `Pay ${formatPrice(totalAmount)}`}
          onPress={handlePlaceOrder}
          disabled={loading}
          fullWidth
        />
      </View>

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Placing your order...</Text>
        </View>
      )}

      {/* Assignment Modal */}
      <Modal visible={showSplitModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Assign: {selectedItem?.name}</Text>
              <TouchableOpacity onPress={() => setShowSplitModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Quantity: {selectedItem?.quantity} • Tap to assign
            </Text>

            <View style={styles.peopleList}>
              {allPeople.map(person => {
                const count = selectedItem ? getAssignmentCount(selectedItem.id, person.id) : 0;
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[styles.personRow, { backgroundColor: count > 0 ? colors.primary + '15' : colors.gray50, borderWidth: count > 0 ? 1 : 0, borderColor: colors.primary }]}
                    onPress={() => handleAssign(person.id, person.name)}
                  >
                    <View style={[styles.personAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.personAvatarText, { color: colors.white }]}>{person.name.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.personName, { color: colors.textPrimary }]}>{person.name}</Text>
                    {count > 0 && (
                      <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.countText, { color: colors.white }]}>{count}</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3 },
  section: { marginTop: spacing.sm, padding: spacing.lg },
  budgetSection: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: { ...textStyles.h4, marginLeft: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  detailLabel: { ...textStyles.body },
  detailValue: { ...textStyles.label },
  splitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  splitToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  splitToggleText: { ...textStyles.label },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  orderItemContainer: { marginBottom: spacing.sm },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  vegIndicator: { width: 14, height: 14, borderWidth: 1.5, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  orderItemName: { ...textStyles.body, flex: 1, marginLeft: spacing.sm },
  orderItemQty: { ...textStyles.body, marginHorizontal: spacing.md },
  orderItemPrice: { ...textStyles.label },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  assignText: { ...textStyles.caption },
  assignedText: { ...textStyles.caption, flex: 1 },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  splitName: { ...textStyles.body },
  splitAmount: { ...textStyles.label },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  paymentIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  paymentInfo: { flex: 1, marginLeft: spacing.md },
  paymentName: { ...textStyles.label },
  paymentDesc: { ...textStyles.caption },
  radioSelected: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  billTotal: { borderTopWidth: 0, paddingTop: 0, marginTop: 0 },
  totalLabel: { ...textStyles.h4 },
  totalValue: { ...textStyles.h3 },
  footer: { padding: spacing.lg, borderTopWidth: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...textStyles.body, marginTop: spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalTitle: { ...textStyles.h4 },
  modalSubtitle: { ...textStyles.caption, marginBottom: spacing.lg },
  peopleList: { marginBottom: spacing.lg },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  personAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { ...textStyles.label },
  personName: { ...textStyles.body, flex: 1, marginLeft: spacing.md },
  countBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
  countText: { ...textStyles.caption, fontWeight: '600' },
});
