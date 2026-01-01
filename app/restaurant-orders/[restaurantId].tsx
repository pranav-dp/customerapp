import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { getCustomerOrdersByRestaurant, Order } from '../../services/orders';
import { formatPrice } from '../../utils/restaurant';
import { Skeleton } from '../../components/ui';

type SortType = 'recent' | 'oldest';

export default function RestaurantOrdersScreen() {
  const colors = useColors();
  
  const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
    pending: { color: colors.warning, icon: 'time-outline', label: 'Pending' },
    confirmed: { color: colors.info, icon: 'checkmark-circle-outline', label: 'Confirmed' },
    preparing: { color: colors.primary, icon: 'flame-outline', label: 'Preparing' },
    ready: { color: colors.success, icon: 'checkmark-done-outline', label: 'Ready' },
    completed: { color: colors.textSecondary, icon: 'checkmark-done', label: 'Completed' },
    cancelled: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled' },
  };

  const { restaurantId, restaurantName } = useLocalSearchParams<{ restaurantId: string; restaurantName: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('recent');

  const fetchOrders = useCallback(async () => {
    if (!user || !restaurantId) return;
    const result = await getCustomerOrdersByRestaurant(user.uid, restaurantId);
    if (result.success) {
      setOrders((result.data as Order[]).filter(o => o.paymentStatus === 'paid'));
    }
    setLoading(false);
  }, [user, restaurantId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
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

  // Sort orders based on selected filter
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
    const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
    return sortBy === 'recent' 
      ? dateB.getTime() - dateA.getTime() 
      : dateA.getTime() - dateB.getTime();
  });

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{restaurantName || 'Restaurant'}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{orders.length} orders • {formatPrice(totalSpent)}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Sort Filters */}
      {!loading && orders.length > 0 && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.gray100 }, sortBy === 'recent' && { backgroundColor: colors.primary }]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, sortBy === 'recent' && { color: colors.white }]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: colors.gray100 }, sortBy === 'oldest' && { backgroundColor: colors.primary }]}
            onPress={() => setSortBy('oldest')}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, sortBy === 'oldest' && { color: colors.white }]}>
              Oldest First
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={120} style={{ marginBottom: spacing.md }} />
          </>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No orders found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You haven't placed any orders at this restaurant yet.
            </Text>
          </View>
        ) : (
          sortedOrders.map(order => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const date = order.createdAt instanceof Date ? order.createdAt : 
              (order.createdAt as any)?.toDate?.() || new Date();
            const canReorder = order.status === 'completed' || order.status === 'cancelled';
            
            return (
              <TouchableOpacity 
                key={order.id!}
                style={[styles.orderCard, { backgroundColor: colors.white, borderColor: colors.gray100 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/order/${order.id}` as any);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>#{order.orderNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Ionicons name={status.icon as any} size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                
                <View style={[styles.orderItems, { borderTopColor: colors.gray100 }]}>
                  <Text style={[styles.itemsText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </Text>
                </View>
                
                <View style={[styles.orderFooter, { borderTopColor: colors.gray100 }]}>
                  <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
                    {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <View style={styles.footerRight}>
                    {canReorder && (
                      <TouchableOpacity 
                        style={[styles.reorderBtn, { backgroundColor: colors.primary + '15' }]} 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleReorder(order);
                        }}
                      >
                        <Ionicons name="refresh" size={14} color={colors.primary} />
                        <Text style={[styles.reorderText, { color: colors.primary }]}>Reorder</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.orderTotal, { color: colors.success }]}>{formatPrice(order.totalAmount)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { ...textStyles.h4 },
  subtitle: { ...textStyles.caption, marginTop: 2 },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterText: {
    ...textStyles.labelSmall,
  },
  content: { padding: spacing.lg, paddingBottom: 100 },
  orderCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: { ...textStyles.h4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: { ...textStyles.caption, fontWeight: '600' },
  orderItems: { 
    paddingVertical: spacing.sm, 
    borderTopWidth: 1, 
  },
  itemsText: { ...textStyles.body },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  orderDate: { ...textStyles.caption },
  footerRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  reorderText: { 
    ...textStyles.caption, 
    fontWeight: '600',
  },
  orderTotal: { ...textStyles.label },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h3, marginBottom: spacing.sm },
  emptyText: { 
    ...textStyles.body, 
    textAlign: 'center', 
    paddingHorizontal: spacing.xxl,
  },
});
