import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders, Order } from '../services/orders';
import { getMenuItemRating } from '../services/itemRatings';
import { formatPrice } from '../utils/restaurant';

export default function InsightsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemRatings, setItemRatings] = useState<Record<string, { rating: number; count: number }>>({});

  const fetchOrders = async () => {
    if (!user) return;
    const result = await getCustomerOrders(user.uid);
    if (result.success) {
      setOrders((result.data as Order[]).filter(o => o.paymentStatus === 'paid'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  // Calculate insights
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Most ordered items with restaurant info
  const itemCounts: Record<string, { name: string; count: number; spent: number; restaurantId: string; restaurantName: string }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.id}_${order.restaurantId}`;
      if (!itemCounts[key]) {
        itemCounts[key] = { 
          name: item.name, 
          count: 0, 
          spent: 0, 
          restaurantId: order.restaurantId,
          restaurantName: order.restaurantName 
        };
      }
      itemCounts[key].count += item.quantity;
      itemCounts[key].spent += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Fetch item ratings for top items
  useEffect(() => {
    const fetchItemRatings = async () => {
      const ratings: Record<string, { rating: number; count: number }> = {};
      for (const item of topItems) {
        const key = `${item.name}_${item.restaurantId}`;
        // Find the item ID from orders
        const order = orders.find(o => o.restaurantId === item.restaurantId);
        const orderItem = order?.items.find(i => i.name === item.name);
        if (orderItem?.id) {
          const result = await getMenuItemRating(item.restaurantId, orderItem.id);
          if (result.success) {
            ratings[key] = { rating: result.rating || 0, count: result.count || 0 };
          }
        }
      }
      setItemRatings(ratings);
    };
    if (topItems.length > 0) {
      fetchItemRatings();
    }
  }, [orders]);

  // Restaurant breakdown
  const restaurantSpend: Record<string, { id: string; name: string; spent: number; orders: number }> = {};
  orders.forEach(order => {
    if (!restaurantSpend[order.restaurantId]) {
      restaurantSpend[order.restaurantId] = { id: order.restaurantId, name: order.restaurantName, spent: 0, orders: 0 };
    }
    restaurantSpend[order.restaurantId].spent += order.totalAmount;
    restaurantSpend[order.restaurantId].orders += 1;
  });
  const topRestaurants = Object.values(restaurantSpend).sort((a, b) => b.spent - a.spent);

  const handleRestaurantPress = (restaurant: { id: string; name: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/restaurant-orders/[restaurantId]',
      params: { restaurantId: restaurant.id, restaurantName: restaurant.name }
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Spending Insights</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} colors={[colors.primary]} />}
        contentContainerStyle={styles.content}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.white }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatPrice(totalSpent)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.white }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalOrders}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Orders</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.white }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{formatPrice(avgOrderValue)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Order</Text>
          </View>
        </View>

        {/* Top Items */}
        {topItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🍔 Most Ordered</Text>
            {topItems.map((item, i) => {
              const ratingKey = `${item.name}_${item.restaurantId}`;
              const ratingData = itemRatings[ratingKey];
              return (
                <View key={`${item.name}-${item.restaurantId}`} style={[styles.listItem, { borderBottomColor: colors.gray100 }]}>
                  <Text style={[styles.rank, { color: colors.primary }]}>#{i + 1}</Text>
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.listItemRestaurant, { color: colors.primary }]}>{item.restaurantName}</Text>
                    <View style={styles.listItemMeta}>
                      <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>{item.count} times • {formatPrice(item.spent)}</Text>
                      {ratingData && ratingData.rating > 0 && (
                        <View style={[styles.itemRatingBadge, { backgroundColor: colors.warningLight || '#FFF8E1' }]}>
                          <Ionicons name="star" size={12} color={colors.warning} />
                          <Text style={[styles.itemRatingText, { color: colors.warning }]}>{ratingData.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Restaurant Breakdown */}
        {topRestaurants.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.white }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏪 By Restaurant</Text>
            {topRestaurants.map(r => (
              <TouchableOpacity 
                key={r.id} 
                style={[styles.restaurantItem, { borderBottomColor: colors.gray100 }]}
                onPress={() => handleRestaurantPress(r)}
                activeOpacity={0.7}
              >
                <View style={styles.listItemInfo}>
                  <Text style={[styles.listItemName, { color: colors.textPrimary }]}>{r.name}</Text>
                  <Text style={[styles.listItemSub, { color: colors.textSecondary }]}>{r.orders} orders</Text>
                </View>
                <View style={styles.restaurantRight}>
                  <Text style={[styles.listItemAmount, { color: colors.success }]}>{formatPrice(r.spent)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {totalOrders === 0 && !loading && (
          <View style={styles.empty}>
            <Ionicons name="analytics-outline" size={64} color={colors.gray300} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No order data yet</Text>
            <Text style={[styles.emptySub, { color: colors.textTertiary }]}>Place some orders to see your insights</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  content: { padding: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, padding: spacing.md,
    borderRadius: borderRadius.lg, alignItems: 'center',
  },
  summaryValue: { ...textStyles.h3 },
  summaryLabel: { ...textStyles.caption, marginTop: 2 },
  section: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { ...textStyles.h4, marginBottom: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  restaurantItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1,
  },
  restaurantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rank: { ...textStyles.label, width: 30 },
  listItemInfo: { flex: 1 },
  listItemName: { ...textStyles.body },
  listItemRestaurant: { ...textStyles.caption, marginTop: 2 },
  listItemMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: spacing.sm },
  listItemSub: { ...textStyles.caption },
  itemRatingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  itemRatingText: { ...textStyles.caption, fontWeight: '600' },
  listItemAmount: { ...textStyles.label },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h4, marginTop: spacing.md },
  emptySub: { ...textStyles.body },
});
