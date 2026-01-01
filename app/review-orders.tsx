import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders, Order } from '../services/orders';
import { Skeleton } from '../components/ui';

type SortType = 'recent' | 'oldest';

export default function ReviewOrdersScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('recent');

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const result = await getCustomerOrders(user.uid);
    if (result.success) {
      // Filter to only completed paid orders
      const completedOrders = (result.data as Order[]).filter(
        o => o.paymentStatus === 'paid' && o.status === 'completed'
      );
      setOrders(completedOrders);
    }
    setLoading(false);
  }, [user]);

  // Refresh when screen comes into focus
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

  // Sort orders based on selected filter
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
    const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
    return sortBy === 'recent' 
      ? dateB.getTime() - dateA.getTime() 
      : dateA.getTime() - dateB.getTime();
  });

  const reviewedCount = orders.filter(o => o.isReviewed).length;
  const notReviewedCount = orders.length - reviewedCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Review Your Orders</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <View style={[styles.statsRow, { backgroundColor: colors.white }]}>
          <View style={[styles.statBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{notReviewedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.primary }]}>To Review</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{reviewedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.success }]}>Reviewed</Text>
          </View>
        </View>
      )}

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
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <Skeleton width="100%" height={100} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={100} style={{ marginBottom: spacing.md }} />
            <Skeleton width="100%" height={100} style={{ marginBottom: spacing.md }} />
          </>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No completed orders</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Once you complete orders, you can review them here.
            </Text>
          </View>
        ) : (
          sortedOrders.map(order => (
            <OrderCard 
              key={order.id || order.orderNumber}
              order={order} 
              onPress={() => router.push(`/review/${order.id}`)}
              colors={colors}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress, colors, key: _key }: { order: Order; onPress: () => void; colors: ReturnType<typeof useColors>; key?: string }) {
  const date = order.createdAt instanceof Date 
    ? order.createdAt 
    : (order.createdAt as any)?.toDate?.() || new Date();
  
  const itemsSummary = order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ');
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';
  const isReviewed = order.isReviewed;

  return (
    <TouchableOpacity style={[styles.orderCard, { backgroundColor: colors.white }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={[styles.orderNumber, { color: colors.primary }]}>#{order.orderNumber}</Text>
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{order.restaurantName}</Text>
        </View>
        <View style={[styles.reviewStatus, isReviewed ? { backgroundColor: colors.successLight } : { backgroundColor: colors.primaryLight }]}>
          <Ionicons 
            name={isReviewed ? "checkmark-circle" : "star-outline"} 
            size={14} 
            color={isReviewed ? colors.success : colors.primary} 
          />
          <Text style={[styles.reviewStatusText, isReviewed ? { color: colors.success } : { color: colors.primary }]}>
            {isReviewed ? 'Reviewed' : 'Review'}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.orderItems, { color: colors.textSecondary }]} numberOfLines={1}>
        {itemsSummary}{moreItems}
      </Text>
      
      <View style={styles.orderFooter}>
        <Text style={[styles.orderDate, { color: colors.textTertiary }]}>
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <Text style={[styles.orderAmount, { color: colors.textPrimary }]}>₹{order.totalAmount}</Text>
      </View>
      
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </View>
    </TouchableOpacity>
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
  title: { ...textStyles.h3 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  statBadge: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    ...textStyles.h2,
  },
  statLabel: {
    ...textStyles.caption,
    marginTop: spacing.xs,
  },
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
  content: { flex: 1, padding: spacing.lg },
  orderCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...textStyles.label,
  },
  restaurantName: {
    ...textStyles.h4,
    marginTop: 2,
  },
  reviewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  reviewStatusText: {
    ...textStyles.labelSmall,
  },
  orderItems: {
    ...textStyles.body,
    marginBottom: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    ...textStyles.caption,
  },
  orderAmount: {
    ...textStyles.label,
  },
  chevronContainer: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
  },
  emptyState: {
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
    paddingHorizontal: spacing.xl,
  },
});
