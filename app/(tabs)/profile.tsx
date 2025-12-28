import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';

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
  const { customer, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              title="Edit Profile"
              onPress={() => {}}
            />
            <MenuItem
              icon="location-outline"
              title="Saved Addresses"
              subtitle={customer?.hostel || 'Add your hostel'}
              onPress={() => {}}
            />
            <MenuItem
              icon="card-outline"
              title="Payment Methods"
              onPress={() => {}}
            />
            <MenuItem
              icon="people-outline"
              title="Friends"
              subtitle={`${customer?.friends?.length || 0} friends for bill splitting`}
              onPress={() => router.push('/friends')}
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
