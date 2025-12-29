import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getCustomerOrders, Order } from '../../services/orders';
import { formatPrice } from '../../utils/restaurant';
import { Skeleton } from '../../components/ui';

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  pending: { color: colors.warning, icon: 'time-outline', label: 'Pending' },
  confirmed: { color: colors.info, icon: 'checkmark-circle-outline', label: 'Confirmed' },
  preparing: { color: colors.primary, icon: 'flame-outline', label: 'Preparing' },
  ready: { color: colors.success, icon: 'checkmark-done-outline', label: 'Ready for Pickup!' },
  completed: { color: colors.textSecondary, icon: 'checkmark-done', label: 'Completed' },
  cancelled: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled' },
};

const OrderCard = ({ order, onReorder }: { order: Order; onReorder: () => void }) => {
  const router = useRouter();
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isReady = order.status === 'ready';
  const date = order.createdAt instanceof Date ? order.createdAt : 
    (order.createdAt as any)?.toDate?.() || new Date();
  const canReorder = order.status === 'completed' || order.status === 'cancelled';
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/order/${order.id}` as any);
  };
  
  return (
    <TouchableOpacity 
      style={[styles.orderCard, isReady && styles.orderCardReady]}
      onPress={handlePress}
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
        <View style={styles.footerRight}>
          {canReorder && (
            <TouchableOpacity style={styles.reorderBtn} onPress={onReorder}>
              <Ionicons name="refresh" size={14} color={colors.primary} />
              <Text style={styles.reorderText}>Reorder</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.orderTotal}>{formatPrice(order.totalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [pastOrders, setPastOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const prevStatusRef = useRef<Record<string, string>>({});

  // Real-time listener for active orders only (minimizes reads)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid),
      where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      // Check for status changes to trigger haptic
      orders.forEach(order => {
        const prevStatus = prevStatusRef.current[order.id!];
        if (prevStatus && prevStatus !== order.status) {
          if (order.status === 'ready') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else if (order.status === 'preparing') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
        prevStatusRef.current[order.id!] = order.status;
      });
      
      setActiveOrders(orders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch past orders only on mount and refresh (not real-time)
  const fetchPastOrders = async () => {
    if (!user) return;
    const result = await getCustomerOrders(user.uid);
    if (result.success) {
      const past = (result.data as Order[]).filter(o => 
        ['completed', 'cancelled'].includes(o.status)
      );
      setPastOrders(past);
    }
  };

  useEffect(() => {
    fetchPastOrders();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPastOrders();
    setRefreshing(false);
  };

  const handleReorder = (order: Order) => {
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
        ) : activeOrders.length === 0 && pastOrders.length === 0 ? (
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
                  <OrderCard key={order.id} order={order} onReorder={() => handleReorder(order)} />
                ))}
              </View>
            )}
            
            {pastOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Orders</Text>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} onReorder={() => handleReorder(order)} />
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
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  title: { ...textStyles.h1, color: colors.textPrimary },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: 100 },
  section: { marginBottom: spacing.xl },
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
  orderCardReady: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
    borderWidth: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: { ...textStyles.h4, color: colors.textPrimary },
  restaurantName: { ...textStyles.body, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: { ...textStyles.caption, fontWeight: '600' },
  orderItems: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.gray100 },
  itemsText: { ...textStyles.body, color: colors.textSecondary },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  orderDate: { ...textStyles.caption, color: colors.textTertiary },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.sm,
  },
  reorderText: { ...textStyles.caption, color: colors.primary, fontWeight: '600' },
  orderTotal: { ...textStyles.label, color: colors.textPrimary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl * 2 },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { ...textStyles.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xxl },
});
