import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';
import { subscribeToOrder, Order } from '../../services/orders';
import { useCart } from '../../contexts/CartContext';
import { formatPrice } from '../../utils/restaurant';
import { sendLocalNotification } from '../../services/notifications';
import * as Haptics from 'expo-haptics';

interface ExtendedOrder extends Order {
  isReviewed?: boolean;
  reviewId?: string;
}

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
const STEP_LABELS = ['Order Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { addItem, clearCart } = useCart();
  const [order, setOrder] = useState<ExtendedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToOrder(id, (orderData) => {
      // Check if status changed to 'ready'
      if (orderData && prevStatusRef.current && prevStatusRef.current !== 'ready' && orderData.status === 'ready') {
        sendLocalNotification(
          '🍔 Your order is ready!',
          `Order #${orderData.orderNumber} is ready for pickup at ${orderData.restaurantName}`
        );
      }
      prevStatusRef.current = orderData?.status || null;
      setOrder(orderData as ExtendedOrder);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleReviewOrder = () => {
    if (!order) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/review/${order.id}`);
  };

  const handleReorder = () => {
    if (!order) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reorder',
      `Add ${order.items.length} items from ${order.restaurantName} to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            clearCart();
            order.items.forEach(item => {
              for (let i = 0; i < item.quantity; i++) {
                addItem({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  isVeg: item.isVeg,
                  restaurantId: order.restaurantId,
                  restaurantName: order.restaurantName,
                });
              }
            });
            router.push('/cart');
          },
        },
      ]
    );
  };

  const canReview = order?.status === 'completed' && order?.paymentStatus === 'paid' && !order?.isReviewed;
  const canReorder = order?.status === 'completed' || order?.status === 'cancelled';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIndex = order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status);
  const date = order.createdAt instanceof Date ? order.createdAt : 
    (order.createdAt as any)?.toDate?.() || new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Order #{order.orderNumber}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.white }]}>
          {order.status === 'cancelled' ? (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={32} color={colors.error} />
              <Text style={[styles.cancelledText, { color: colors.error }]}>Order Cancelled</Text>
            </View>
          ) : order.status === 'ready' ? (
            <View style={styles.readyBanner}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={[styles.readyTitle, { color: colors.success }]}>Your order is ready!</Text>
              <Text style={[styles.readySubtitle, { color: colors.textSecondary }]}>Please pick it up from {order.restaurantName}</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                {order.status === 'preparing' ? 'Your food is being prepared' : 
                 order.status === 'confirmed' ? 'Order confirmed' : 'Order placed'}
              </Text>
              
              {/* Progress Steps */}
              <View style={styles.progressContainer}>
                {STEPS.slice(0, 4).map((step, index) => (
                  <View key={step} style={styles.stepContainer}>
                    <View style={[
                      styles.stepDot,
                      { backgroundColor: index <= currentStepIndex ? colors.success : colors.gray200 }
                    ]}>
                      {index < currentStepIndex && (
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      )}
                    </View>
                    {index < 3 && (
                      <View style={[
                        styles.stepLine,
                        { backgroundColor: index < currentStepIndex ? colors.success : colors.gray200 }
                      ]} />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.stepLabels}>
                {STEP_LABELS.slice(0, 4).map((label, index) => (
                  <Text key={label} style={[
                    styles.stepLabel,
                    { color: index <= currentStepIndex ? colors.textPrimary : colors.textTertiary, fontWeight: index <= currentStepIndex ? '600' : 'normal' }
                  ]}>{label}</Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Restaurant */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{order.restaurantName}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.vegIndicator, { borderColor: item.isVeg ? colors.veg : colors.nonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.veg : colors.nonVeg }]} />
              </View>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>x{item.quantity}</Text>
              <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          
          <View style={[styles.totalRow, { borderTopColor: colors.gray100 }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Bill Split */}
        {order.splitSummary && Object.keys(order.splitSummary).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.white }]}>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Bill Split</Text>
            {Object.entries(order.splitSummary).map(([name, amount]) => (
              <View key={name} style={[styles.splitRow, { borderBottomColor: colors.gray100 }]}>
                <Text style={[styles.splitName, { color: colors.textPrimary }]}>{name}</Text>
                <Text style={[styles.splitAmount, { color: colors.success }]}>{formatPrice(amount as number)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Order Info */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Order Details</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{order.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Placed on</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {date.toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Payment</Text>
            <Text style={[styles.infoValue, { color: colors.success }]}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
          {order.isReviewed && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Review</Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>Reviewed ✓</Text>
            </View>
          )}
        </View>

        {/* Review Button */}
        {canReview && (
          <View style={[styles.reviewSection, { backgroundColor: colors.white }]}>
            <TouchableOpacity style={[styles.reviewButton, { backgroundColor: colors.primary }]} onPress={handleReviewOrder}>
              <Ionicons name="star-outline" size={20} color={colors.white} />
              <Text style={[styles.reviewButtonText, { color: colors.white }]}>Review Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reorder Button */}
        {canReorder && (
          <View style={[styles.reorderSection, { backgroundColor: colors.white }]}>
            <TouchableOpacity style={[styles.reorderButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]} onPress={handleReorder}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={[styles.reorderButtonText, { color: colors.primary }]}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...textStyles.h3,
    marginTop: spacing.md,
  },
  backLink: {
    ...textStyles.label,
    marginTop: spacing.md,
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
  statusCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  statusTitle: {
    ...textStyles.h3,
    marginBottom: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  stepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 3,
  },
  stepLabels: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stepLabel: {
    flex: 1,
    ...textStyles.caption,
    textAlign: 'center',
  },
  readyBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  readyTitle: {
    ...textStyles.h2,
    marginTop: spacing.md,
  },
  readySubtitle: {
    ...textStyles.body,
    marginTop: spacing.xs,
  },
  cancelledBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  cancelledText: {
    ...textStyles.h3,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...textStyles.h4,
    marginLeft: spacing.sm,
  },
  sectionSubtitle: {
    ...textStyles.label,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
  itemName: {
    ...textStyles.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemQty: {
    ...textStyles.body,
    marginHorizontal: spacing.md,
  },
  itemPrice: {
    ...textStyles.label,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: {
    ...textStyles.h4,
  },
  totalValue: {
    ...textStyles.h3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...textStyles.body,
  },
  infoValue: {
    ...textStyles.body,
    flex: 1,
    textAlign: 'right',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  splitName: {
    ...textStyles.body,
  },
  splitAmount: {
    ...textStyles.label,
  },
  reviewSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  reviewButtonText: {
    ...textStyles.label,
  },
  reorderSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  reorderButtonText: {
    ...textStyles.label,
  },
});
