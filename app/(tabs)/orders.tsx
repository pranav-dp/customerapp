import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerOrders, Order } from '../../services/orders';
import { formatPrice } from '../../utils/restaurant';
import { Skeleton } from '../../components/ui';

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: colors.warning, icon: 'time-outline', label: 'Pending' },
  confirmed: { color: colors.info, icon: 'checkmark-circle-outline', label: 'Confirmed' },
  preparing: { color: colors.primary, icon: 'flame-outline', label: 'Preparing' },
  ready: { color: colors.success, icon: 'checkmark-done-outline', label: 'Ready!' },
  completed: { color: colors.textSecondary, icon: 'checkmark-done', label: 'Completed' },
  cancelled: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled' },
};

const OrderCard = ({ order }: { order: Order }) => {
  const router = useRouter();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const date = order.createdAt instanceof Date ? order.createdAt : 
    (order.createdAt as any)?.toDate?.() || new Date();
  
  return (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => router.push(`/order/${order.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Ionicons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      
      <View style={styles.orderItems}>
        <Text style={styles.itemsText} numberOfLines={1}>
          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
        </Text>
      </View>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.orderTotal}>{formatPrice(order.totalAmount)}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    if (!user) {
      console.log('Orders: No user logged in');
      setLoading(false);
      return;
    }
    console.log('Orders: Fetching for user', user.uid);
    const result = await getCustomerOrders(user.uid);
    console.log('Orders: Result', result.success, result.error, result.data?.length);
    if (result.success) {
      setOrders(result.data as Order[]);
    } else {
      console.error('Orders: Fetch failed', result.error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
          </>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptyText}>
              When you place an order, it will appear here for you to track.
            </Text>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Orders</Text>
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </View>
            )}
            
            {pastOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Orders</Text>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  restaurantName: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  orderItems: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  itemsText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  orderDate: {
    ...textStyles.caption,
    color: colors.textTertiary,
  },
  orderTotal: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
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
    paddingHorizontal: spacing.xxl,
  },
});
