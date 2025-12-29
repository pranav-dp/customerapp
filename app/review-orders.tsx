import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders, Order } from '../services/orders';
import { Skeleton } from '../components/ui';

type SortType = 'recent' | 'oldest';

export default function ReviewOrdersScreen() {
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Review Your Orders</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{notReviewedCount}</Text>
            <Text style={styles.statLabel}>To Review</Text>
          </View>
          <View style={[styles.statBadge, styles.statBadgeSecondary]}>
            <Text style={[styles.statNumber, styles.statNumberSecondary]}>{reviewedCount}</Text>
            <Text style={[styles.statLabel, styles.statLabelSecondary]}>Reviewed</Text>
          </View>
        </View>
      )}

      {/* Sort Filters */}
      {!loading && orders.length > 0 && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterBtn, sortBy === 'recent' && styles.filterBtnActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text style={[styles.filterText, sortBy === 'recent' && styles.filterTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, sortBy === 'oldest' && styles.filterBtnActive]}
            onPress={() => setSortBy('oldest')}
          >
            <Text style={[styles.filterText, sortBy === 'oldest' && styles.filterTextActive]}>
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
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No completed orders</Text>
            <Text style={styles.emptyText}>
              Once you complete orders, you can review them here.
            </Text>
          </View>
        ) : (
          sortedOrders.map(order => (
            <OrderCard 
              key={order.id || order.orderNumber}
              order={order} 
              onPress={() => router.push(`/review/${order.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order, onPress, key: _key }: { order: Order; onPress: () => void; key?: string }) {
  const date = order.createdAt instanceof Date 
    ? order.createdAt 
    : (order.createdAt as any)?.toDate?.() || new Date();
  
  const itemsSummary = order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ');
  const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : '';
  const isReviewed = order.isReviewed;

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
        </View>
        <View style={[styles.reviewStatus, isReviewed ? styles.reviewedStatus : styles.notReviewedStatus]}>
          <Ionicons 
            name={isReviewed ? "checkmark-circle" : "star-outline"} 
            size={14} 
            color={isReviewed ? colors.success : colors.primary} 
          />
          <Text style={[styles.reviewStatusText, isReviewed ? styles.reviewedText : styles.notReviewedText]}>
            {isReviewed ? 'Reviewed' : 'Review'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.orderItems} numberOfLines={1}>
        {itemsSummary}{moreItems}
      </Text>
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
      </View>
      
      <View style={styles.chevronContainer}>
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      </View>
    </TouchableOpacity>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  statBadge: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statBadgeSecondary: {
    backgroundColor: colors.successLight,
  },
  statNumber: {
    ...textStyles.h2,
    color: colors.primary,
  },
  statNumberSecondary: {
    color: colors.success,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statLabelSecondary: {
    color: colors.success,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  content: { flex: 1, padding: spacing.lg },
  orderCard: {
    backgroundColor: colors.white,
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
    color: colors.primary,
  },
  restaurantName: {
    ...textStyles.h4,
    color: colors.textPrimary,
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
  notReviewedStatus: {
    backgroundColor: colors.primaryLight,
  },
  reviewedStatus: {
    backgroundColor: colors.successLight,
  },
  reviewStatusText: {
    ...textStyles.labelSmall,
  },
  notReviewedText: {
    color: colors.primary,
  },
  reviewedText: {
    color: colors.success,
  },
  orderItems: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    ...textStyles.caption,
    color: colors.textTertiary,
  },
  orderAmount: {
    ...textStyles.label,
    color: colors.textPrimary,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
