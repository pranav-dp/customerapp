import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useColors } from '../../hooks/useColors';
import { getCustomerOrders, Order } from '../../services/orders';
import { formatPrice } from '../../utils/restaurant';
import { Skeleton } from '../../components/ui';

const getStatusConfig = (colors: ReturnType<typeof useColors>) => ({
  pending: { color: colors.warning, icon: 'time-outline', label: 'Pending' },
  confirmed: { color: colors.info, icon: 'checkmark-circle-outline', label: 'Confirmed' },
  preparing: { color: colors.primary, icon: 'flame-outline', label: 'Preparing' },
  ready: { color: colors.success, icon: 'checkmark-done-outline', label: 'Ready for Pickup!' },
  completed: { color: colors.textSecondary, icon: 'checkmark-done', label: 'Completed' },
  cancelled: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled' },
});

const OrderCard = ({ order, onReorder, colors }: { order: Order; onReorder: () => void; colors: ReturnType<typeof useColors> }) => {
  const router = useRouter();
  const STATUS_CONFIG = getStatusConfig(colors);
  const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
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
      style={[
        styles.orderCard, 
        { backgroundColor: colors.white, borderColor: colors.gray100 },
        isReady && { backgroundColor: colors.successLight, borderColor: colors.success, borderWidth: 2 }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>#{order.orderNumber}</Text>
          <Text style={[styles.restaurantName, { color: colors.textSecondary }]}>{order.restaurantName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Ionicons name={status.icon as any} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      
      <View style={[styles.orderItems, { borderTopColor: colors.gray100 }]}>
        <Text style={[styles.itemsText, { color: colors.textSecondary }]} numberOfLines={1}>
          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
        </Text>
      </View>
      
      <View style={[styles.orderFooter, { borderTopColor: colors.gray100 }]}>
        <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.footerRight}>
          {canReorder && (
            <TouchableOpacity style={[styles.reorderBtn, { backgroundColor: colors.primary + '15' }]} onPress={onReorder}>
              <Ionicons name="refresh" size={14} color={colors.primary} />
              <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{formatPrice(order.totalAmount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const colors = useColors();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.gray100, backgroundColor: colors.white }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Orders</Text>
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
            <View style={[styles.emptyIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No orders yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              When you place an order, it will appear here for you to track.
            </Text>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Active Orders</Text>
                {activeOrders.map(order => (
                  <OrderCard key={order.id} order={order} onReorder={() => handleReorder(order)} colors={colors} />
                ))}
              </View>
            )}
            
            {pastOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Past Orders</Text>
                {pastOrders.map(order => (
                  <OrderCard key={order.id} order={order} onReorder={() => handleReorder(order)} colors={colors} />
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
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...textStyles.h1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: 100 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...textStyles.label,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderNumber: { ...textStyles.h4 },
  restaurantName: { ...textStyles.body, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: { ...textStyles.caption, fontWeight: '600' },
  orderItems: { paddingVertical: spacing.sm, borderTopWidth: 1 },
  itemsText: { ...textStyles.body },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  orderDate: { ...textStyles.caption },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  reorderText: { ...textStyles.caption, fontWeight: '600' },
  orderTotal: { ...textStyles.label },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl * 2 },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h2, marginBottom: spacing.sm },
  emptyText: { ...textStyles.body, textAlign: 'center', paddingHorizontal: spacing.xxl },
});
