import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { subscribeToOrder, Order } from '../../services/orders';
import { formatPrice } from '../../utils/restaurant';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
const STEP_LABELS = ['Order Placed', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToOrder(id, (orderData) => {
      setOrder(orderData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepIndex = order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status);
  const date = order.createdAt instanceof Date ? order.createdAt : 
    (order.createdAt as any)?.toDate?.() || new Date();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          {order.status === 'cancelled' ? (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={32} color={colors.error} />
              <Text style={styles.cancelledText}>Order Cancelled</Text>
            </View>
          ) : order.status === 'ready' ? (
            <View style={styles.readyBanner}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text style={styles.readyTitle}>Your order is ready!</Text>
              <Text style={styles.readySubtitle}>Please pick it up from {order.restaurantName}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.statusTitle}>
                {order.status === 'preparing' ? 'Your food is being prepared' : 
                 order.status === 'confirmed' ? 'Order confirmed' : 'Order placed'}
              </Text>
              
              {/* Progress Steps */}
              <View style={styles.progressContainer}>
                {STEPS.slice(0, 4).map((step, index) => (
                  <View key={step} style={styles.stepContainer}>
                    <View style={[
                      styles.stepDot,
                      index <= currentStepIndex && styles.stepDotActive
                    ]}>
                      {index < currentStepIndex && (
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      )}
                    </View>
                    {index < 3 && (
                      <View style={[
                        styles.stepLine,
                        index < currentStepIndex && styles.stepLineActive
                      ]} />
                    )}
                  </View>
                ))}
              </View>
              <View style={styles.stepLabels}>
                {STEP_LABELS.slice(0, 4).map((label, index) => (
                  <Text key={label} style={[
                    styles.stepLabel,
                    index <= currentStepIndex && styles.stepLabelActive
                  ]}>{label}</Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Restaurant */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>{order.restaurantName}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.vegIndicator, item.isVeg ? styles.vegVeg : styles.vegNonVeg]}>
                <View style={[styles.vegDot, item.isVeg ? styles.dotVeg : styles.dotNonVeg]} />
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Bill Split */}
        {order.splitSummary && Object.keys(order.splitSummary).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionSubtitle}>Bill Split</Text>
            {Object.entries(order.splitSummary).map(([name, amount]) => (
              <View key={name} style={styles.splitRow}>
                <Text style={styles.splitName}>{name}</Text>
                <Text style={styles.splitAmount}>{formatPrice(amount as number)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionSubtitle}>Order Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>{order.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placed on</Text>
            <Text style={styles.infoValue}>
              {date.toLocaleDateString('en-IN', { 
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment</Text>
            <Text style={[styles.infoValue, { color: colors.success }]}>
              {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  backLink: {
    ...textStyles.label,
    color: colors.primary,
    marginTop: spacing.md,
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
  statusCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    alignItems: 'center',
  },
  statusTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
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
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.success,
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.gray200,
  },
  stepLineActive: {
    backgroundColor: colors.success,
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
    color: colors.textTertiary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  readyBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  readyTitle: {
    ...textStyles.h2,
    color: colors.success,
    marginTop: spacing.md,
  },
  readySubtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  cancelledBanner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  cancelledText: {
    ...textStyles.h3,
    color: colors.error,
    marginTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  sectionSubtitle: {
    ...textStyles.label,
    color: colors.textSecondary,
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
  vegVeg: { borderColor: colors.veg },
  vegNonVeg: { borderColor: colors.nonVeg },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  dotVeg: { backgroundColor: colors.veg },
  dotNonVeg: { backgroundColor: colors.nonVeg },
  itemName: {
    ...textStyles.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.sm,
  },
  itemQty: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  itemPrice: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  totalLabel: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  totalValue: {
    ...textStyles.h3,
    color: colors.success,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...textStyles.body,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  splitName: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  splitAmount: {
    ...textStyles.label,
    color: colors.success,
  },
});
