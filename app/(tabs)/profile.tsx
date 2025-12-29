import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomerOrders } from '../../services/orders';
import { getMoneyOwedToMe } from '../../services/friends';
import { getReviewsByCustomer } from '../../services/reviews';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { customer, user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ orders: 0, spent: 0 });
  const [owedToMe, setOwedToMe] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewableOrders, setReviewableOrders] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // Fetch orders stats
    const ordersResult = await getCustomerOrders(user.uid);
    if (ordersResult.success) {
      const paidOrders = (ordersResult.data as any[]).filter(o => o.paymentStatus === 'paid');
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      setStats({ orders: paidOrders.length, spent: totalSpent });
      
      // Get reviewable orders (completed and not reviewed)
      const reviewable = paidOrders
        .filter(o => o.status === 'completed' && !o.isReviewed)
        .slice(0, 3);
      setReviewableOrders(reviewable);
    }
    
    // Fetch review count
    const reviewsResult = await getReviewsByCustomer(user.uid);
    if (reviewsResult.success) {
      setReviewCount(reviewsResult.data.length);
    }
  }, [user]);

  const fetchOwed = useCallback(async () => {
    if (!customer?.id) return;
    const result = await getMoneyOwedToMe(customer.id);
    if (result.success) setOwedToMe(result.total);
  }, [customer?.id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchOwed();
    }, [fetchData, fetchOwed])
  );

  const iOwe = Object.values(customer?.owes || {}).reduce((sum, amt) => sum + amt, 0);

  const handleLogout = async () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log out', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/welcome');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{customer?.name || 'User'}</Text>
          <Text style={styles.email}>{customer?.email}</Text>
          {customer?.rollNumber && (
            <View style={styles.badge}>
              <Ionicons name="school-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>{customer.rollNumber}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.orders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{stats.spent}</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{customer?.favorites?.length || 0}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Money Summary */}
        {(owedToMe > 0 || iOwe > 0) && (
          <View style={styles.moneyContainer}>
            {owedToMe > 0 && (
              <TouchableOpacity style={styles.moneyCard} onPress={() => router.push('/money-owed?tab=toMe')}>
                <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
                <View style={styles.moneyInfo}>
                  <Text style={styles.moneyLabel}>Friends owe you</Text>
                  <Text style={[styles.moneyAmount, { color: colors.success }]}>₹{owedToMe}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
            {iOwe > 0 && (
              <TouchableOpacity style={styles.moneyCard} onPress={() => router.push('/money-owed')}>
                <Ionicons name="arrow-up-circle" size={24} color={colors.warning} />
                <View style={styles.moneyInfo}>
                  <Text style={styles.moneyLabel}>You owe friends</Text>
                  <Text style={[styles.moneyAmount, { color: colors.warning }]}>₹{iOwe}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push('/edit-profile')}
            />
            <MenuItem
              icon="analytics-outline"
              title="Spending Insights"
              subtitle="Track your food spending"
              onPress={() => router.push('/insights')}
            />
            <MenuItem
              icon="people-outline"
              title="Friends"
              subtitle={`${customer?.friends?.length || 0} friends for bill splitting`}
              onPress={() => router.push('/friends')}
            />
            <MenuItem
              icon="star-outline"
              title="Your Reviews"
              subtitle={`${reviewCount} reviews posted`}
              onPress={() => router.push('/your-reviews')}
            />
            <MenuItem
              icon="create-outline"
              title="Review Your Orders"
              subtitle={`${reviewableOrders.length} orders to review`}
              onPress={() => router.push('/review-orders')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => {}}
            />
            <MenuItem
              icon="moon-outline"
              title="Appearance"
              subtitle="Light"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={() => {}}
            />
            <MenuItem
              icon="chatbubble-outline"
              title="Contact Us"
              onPress={() => {}}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terms & Privacy"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              title="Log out"
              onPress={handleLogout}
              showChevron={false}
              danger
            />
          </View>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    ...textStyles.displayMedium,
    color: colors.black,
  },
  name: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  email: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  badgeText: {
    ...textStyles.labelSmall,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginTop: 1,
    paddingVertical: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
  },
  moneyContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  moneyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  moneyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  moneyLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  moneyAmount: {
    ...textStyles.h3,
  },
  menuSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  menuSectionTitle: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: colors.errorLight,
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  menuTitleDanger: {
    color: colors.error,
  },
  menuSubtitle: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  version: {
    ...textStyles.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
});
