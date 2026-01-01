import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useColors } from '../../hooks/useColors';
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
  colors: ReturnType<typeof useColors>;
}

function MenuItem({ icon, title, subtitle, onPress, showChevron = true, danger = false, colors }: MenuItemProps) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.gray100 }]} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? colors.errorLight : colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: danger ? colors.error : colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { customer, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const colors = useColors();
  const router = useRouter();
  const [stats, setStats] = useState({ orders: 0, spent: 0 });
  const [owedToMe, setOwedToMe] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewableOrders, setReviewableOrders] = useState<any[]>([]);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.white }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { color: colors.black }]}>
              {customer?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{customer?.name || 'User'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{customer?.email}</Text>
          {customer?.rollNumber && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="school-outline" size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>{customer.rollNumber}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.white }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.orders}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.spent}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Spent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{customer?.favorites?.length || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
          </View>
        </View>

        {/* Money Summary */}
        {(owedToMe > 0 || iOwe > 0) && (
          <View style={styles.moneyContainer}>
            {owedToMe > 0 && (
              <TouchableOpacity style={[styles.moneyCard, { backgroundColor: colors.white }]} onPress={() => router.push('/money-owed?tab=toMe')}>
                <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
                <View style={styles.moneyInfo}>
                  <Text style={[styles.moneyLabel, { color: colors.textSecondary }]}>Friends owe you</Text>
                  <Text style={[styles.moneyAmount, { color: colors.success }]}>₹{owedToMe}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
            {iOwe > 0 && (
              <TouchableOpacity style={[styles.moneyCard, { backgroundColor: colors.white }]} onPress={() => router.push('/money-owed')}>
                <Ionicons name="arrow-up-circle" size={24} color={colors.warning} />
                <View style={styles.moneyInfo}>
                  <Text style={[styles.moneyLabel, { color: colors.textSecondary }]}>You owe friends</Text>
                  <Text style={[styles.moneyAmount, { color: colors.warning }]}>₹{iOwe}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Account</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.white }]}>
            <MenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => router.push('/edit-profile')}
              colors={colors}
            />
            <MenuItem
              icon="analytics-outline"
              title="Spending Insights"
              subtitle="Track your food spending"
              onPress={() => router.push('/insights')}
              colors={colors}
            />
            <MenuItem
              icon="people-outline"
              title="Friends"
              subtitle={`${customer?.friends?.length || 0} friends for bill splitting`}
              onPress={() => router.push('/friends')}
              colors={colors}
            />
            <MenuItem
              icon="star-outline"
              title="Your Reviews"
              subtitle={`${reviewCount} reviews posted`}
              onPress={() => router.push('/your-reviews')}
              colors={colors}
            />
            <MenuItem
              icon="create-outline"
              title="Review Your Orders"
              subtitle={`${reviewableOrders.length} orders to review`}
              onPress={() => router.push('/review-orders')}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.white }]}>
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => {}}
              colors={colors}
            />
            <MenuItem
              icon="moon-outline"
              title="Appearance"
              subtitle={theme === 'dark' ? 'Dark' : 'Light'}
              onPress={() => setShowAppearanceModal(true)}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.menuSectionTitle, { color: colors.textSecondary }]}>Support</Text>
          <View style={[styles.menuCard, { backgroundColor: colors.white }]}>
            <MenuItem
              icon="help-circle-outline"
              title="Help & FAQ"
              onPress={() => {}}
              colors={colors}
            />
            <MenuItem
              icon="chatbubble-outline"
              title="Contact Us"
              onPress={() => {}}
              colors={colors}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terms & Privacy"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={[styles.menuCard, { backgroundColor: colors.white }]}>
            <MenuItem
              icon="log-out-outline"
              title="Log out"
              onPress={handleLogout}
              showChevron={false}
              danger
              colors={colors}
            />
          </View>
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0</Text>
      </ScrollView>

      {/* Appearance Modal */}
      <Modal
        visible={showAppearanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppearanceModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAppearanceModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Appearance</Text>
            
            <TouchableOpacity 
              style={[styles.themeOption, theme === 'light' && { backgroundColor: colors.primaryLight }]}
              onPress={() => { setTheme('light'); setShowAppearanceModal(false); }}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: colors.gray100 }]}>
                <Ionicons name="sunny" size={24} color={colors.warning} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeTitle, { color: colors.textPrimary }]}>Light</Text>
                <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>Classic bright appearance</Text>
              </View>
              {theme === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.themeOption, theme === 'dark' && { backgroundColor: colors.primaryLight }]}
              onPress={() => { setTheme('dark'); setShowAppearanceModal(false); }}
            >
              <View style={[styles.themeIconContainer, { backgroundColor: colors.gray100 }]}>
                <Ionicons name="moon" size={24} color={colors.info} />
              </View>
              <View style={styles.themeInfo}>
                <Text style={[styles.themeTitle, { color: colors.textPrimary }]}>Dark</Text>
                <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>Easy on the eyes</Text>
              </View>
              {theme === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalCloseBtn, { backgroundColor: colors.gray100 }]}
              onPress={() => setShowAppearanceModal(false)}
            >
              <Text style={[styles.modalCloseBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    ...textStyles.displayMedium,
  },
  name: {
    ...textStyles.h2,
  },
  email: {
    ...textStyles.body,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  badgeText: {
    ...textStyles.labelSmall,
    marginLeft: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 1,
    paddingVertical: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h2,
  },
  statLabel: {
    ...textStyles.caption,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
  },
  moneyContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  moneyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  moneyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  moneyLabel: {
    ...textStyles.caption,
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
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    ...textStyles.label,
  },
  menuSubtitle: {
    ...textStyles.caption,
    marginTop: 2,
  },
  version: {
    ...textStyles.caption,
    textAlign: 'center',
    marginVertical: spacing.xxl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  modalTitle: {
    ...textStyles.h3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  themeTitle: {
    ...textStyles.label,
  },
  themeSubtitle: {
    ...textStyles.caption,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseBtnText: {
    ...textStyles.label,
  },
});
