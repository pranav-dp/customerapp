import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getCustomerOrders, Order } from '../services/orders';
import { formatPrice } from '../utils/restaurant';

export default function InsightsScreen() {
  const router = useRouter();
  const { user, customer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Most ordered items
  const itemCounts: Record<string, { name: string; count: number; spent: number }> = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { name: item.name, count: 0, spent: 0 };
      }
      itemCounts[item.name].count += item.quantity;
      itemCounts[item.name].spent += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Spending Insights</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} colors={[colors.primary]} />}
        contentContainerStyle={styles.content}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatPrice(totalSpent)}</Text>
            <Text style={styles.summaryLabel}>Total Spent</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalOrders}</Text>
            <Text style={styles.summaryLabel}>Orders</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatPrice(avgOrderValue)}</Text>
            <Text style={styles.summaryLabel}>Avg Order</Text>
          </View>
        </View>

        {/* Top Items */}
        {topItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍔 Most Ordered</Text>
            {topItems.map((item, i) => (
              <View key={item.name} style={styles.listItem}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemSub}>{item.count} times • {formatPrice(item.spent)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Restaurant Breakdown */}
        {topRestaurants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏪 By Restaurant</Text>
            {topRestaurants.map(r => (
              <TouchableOpacity 
                key={r.id} 
                style={styles.restaurantItem}
                onPress={() => handleRestaurantPress(r)}
                activeOpacity={0.7}
              >
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{r.name}</Text>
                  <Text style={styles.listItemSub}>{r.orders} orders</Text>
                </View>
                <View style={styles.restaurantRight}>
                  <Text style={styles.listItemAmount}>{formatPrice(r.spent)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {totalOrders === 0 && !loading && (
          <View style={styles.empty}>
            <Ionicons name="analytics-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyText}>No order data yet</Text>
            <Text style={styles.emptySub}>Place some orders to see your insights</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  content: { padding: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryCard: {
    flex: 1, backgroundColor: colors.white, padding: spacing.md,
    borderRadius: borderRadius.lg, alignItems: 'center',
  },
  summaryValue: { ...textStyles.h3, color: colors.primary },
  summaryLabel: { ...textStyles.caption, color: colors.textSecondary, marginTop: 2 },
  section: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { ...textStyles.h4, color: colors.textPrimary, marginBottom: spacing.md },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  restaurantItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.gray100,
  },
  restaurantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rank: { ...textStyles.label, color: colors.primary, width: 30 },
  listItemInfo: { flex: 1 },
  listItemName: { ...textStyles.body, color: colors.textPrimary },
  listItemSub: { ...textStyles.caption, color: colors.textSecondary },
  listItemAmount: { ...textStyles.label, color: colors.success },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h4, color: colors.textSecondary, marginTop: spacing.md },
  emptySub: { ...textStyles.body, color: colors.textTertiary },
});
