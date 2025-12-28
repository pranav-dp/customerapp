import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { getRestaurant } from '../../services/firestore';
import { getRestaurantStatus, formatPrice, OperatingHours } from '../../utils/restaurant';
import { MenuItemCard, CategoryTabs, ClosedBanner, MenuItem } from '../../components/menu';
import { CartBar } from '../../components/cart';
import { Skeleton } from '../../components/ui';
import { useCart } from '../../contexts/CartContext';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  heroImage?: string;
  operatingHours?: OperatingHours;
  menu?: MenuItem[];
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, restaurantId: cartRestaurantId, totalItems } = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [filter, setFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;
      const result = await getRestaurant(id);
      if (result.success && result.data) {
        setRestaurant(result.data as Restaurant);
      }
      setLoading(false);
    };
    fetchRestaurant();
  }, [id]);

  const status = useMemo(() => {
    return getRestaurantStatus(restaurant?.operatingHours);
  }, [restaurant?.operatingHours]);

  // Process menu: filter, sort (unavailable at bottom), group by category
  const { categories, filteredMenu, itemCounts } = useMemo(() => {
    if (!restaurant?.menu) return { categories: ['All'], filteredMenu: [], itemCounts: { All: 0 } };

    let items = [...restaurant.menu];

    // Apply veg/nonveg filter
    if (filter === 'veg') {
      items = items.filter(item => item.isVeg === true);
    } else if (filter === 'nonveg') {
      items = items.filter(item => item.isVeg === false);
    }

    // Get unique categories
    const uniqueCategories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

    // Count items per category
    const counts: Record<string, number> = { All: items.length };
    items.forEach(item => {
      if (item.category) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });

    // Filter by active category
    if (activeCategory !== 'All') {
      items = items.filter(item => item.category === activeCategory);
    }

    // Sort: available items first, then unavailable
    items.sort((a, b) => {
      if (a.isAvailable === b.isAvailable) return 0;
      return a.isAvailable ? -1 : 1;
    });

    return { categories: uniqueCategories, filteredMenu: items, itemCounts: counts };
  }, [restaurant?.menu, activeCategory, filter]);

  const handleAddToCart = (item: MenuItem) => {
    if (!status.isOpen) {
      Alert.alert('Restaurant Closed', status.message);
      return;
    }
    if (!restaurant) return;
    
    // Warn if adding from different restaurant
    if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
      Alert.alert(
        'Replace cart?',
        'Your cart has items from another restaurant. Adding this will clear your current cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Replace', 
            style: 'destructive',
            onPress: () => addItem({
              id: item.id,
              name: item.name,
              price: item.price,
              isVeg: item.isVeg,
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
            })
          },
        ]
      );
      return;
    }

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      isVeg: item.isVeg,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={28} style={{ marginBottom: 12 }} />
          <Skeleton width="80%" height={16} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} style={{ marginBottom: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!restaurant) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="sad-outline" size={48} color={colors.gray300} />
          <Text style={styles.errorText}>Restaurant not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableCount = restaurant.menu?.filter(i => i.isAvailable).length || 0;
  const totalCount = restaurant.menu?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          {restaurant.description && (
            <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
          )}
          
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, status.isOpen ? styles.statusOpen : styles.statusClosed]}>
              <View style={[styles.statusDot, status.isOpen ? styles.dotOpen : styles.dotClosed]} />
              <Text style={[styles.statusText, status.isOpen ? styles.textOpen : styles.textClosed]}>
                {status.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
            <Text style={styles.statusMessage}>{status.message}</Text>
          </View>

          {/* Menu Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{availableCount} items available</Text>
            </View>
            {totalCount > availableCount && (
              <Text style={styles.unavailableText}>
                {totalCount - availableCount} unavailable
              </Text>
            )}
          </View>
        </View>

        {/* Closed Banner */}
        <ClosedBanner status={status} />

        {/* Filters & Categories - Sticky */}
        <View style={styles.filtersContainer}>
          {/* Veg/Non-veg Filter */}
          <View style={styles.vegFilters}>
            <TouchableOpacity
              style={[styles.vegFilterButton, filter === 'veg' && styles.vegFilterActive]}
              onPress={() => setFilter(filter === 'veg' ? 'all' : 'veg')}
            >
              <View style={[styles.vegIndicator, styles.vegIndicatorVeg]}>
                <View style={[styles.vegDot, styles.vegDotVeg]} />
              </View>
              <Text style={[styles.vegFilterText, filter === 'veg' && styles.vegFilterTextActive]}>Veg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.vegFilterButton, filter === 'nonveg' && styles.nonvegFilterActive]}
              onPress={() => setFilter(filter === 'nonveg' ? 'all' : 'nonveg')}
            >
              <View style={[styles.vegIndicator, styles.vegIndicatorNonVeg]}>
                <View style={[styles.vegDot, styles.vegDotNonVeg]} />
              </View>
              <Text style={[styles.vegFilterText, filter === 'nonveg' && styles.nonvegFilterTextActive]}>Non-veg</Text>
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            itemCounts={itemCounts}
          />
        </View>

        {/* Menu Items */}
        <View style={[styles.menuContainer, totalItems > 0 && { paddingBottom: 100 }]}>
          {filteredMenu.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Ionicons name="restaurant-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No items found</Text>
              {filter !== 'all' && (
                <TouchableOpacity onPress={() => setFilter('all')}>
                  <Text style={styles.clearFilterText}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredMenu.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onPress={() => {/* TODO: Item detail modal */}}
                onAddToCart={() => handleAddToCart(item)}
                disabled={!status.isOpen}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <CartBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  restaurantInfo: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  restaurantName: {
    ...textStyles.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  restaurantDescription: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  statusOpen: {
    backgroundColor: colors.successLight,
  },
  statusClosed: {
    backgroundColor: colors.errorLight,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  dotOpen: {
    backgroundColor: colors.success,
  },
  dotClosed: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...textStyles.labelSmall,
  },
  textOpen: {
    color: colors.success,
  },
  textClosed: {
    color: colors.error,
  },
  statusMessage: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  unavailableText: {
    ...textStyles.bodySmall,
    color: colors.textTertiary,
    marginLeft: spacing.md,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  vegFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  vegFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
  },
  vegFilterActive: {
    borderColor: colors.veg,
    backgroundColor: colors.successLight,
  },
  nonvegFilterActive: {
    borderColor: colors.nonVeg,
    backgroundColor: colors.errorLight,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  vegIndicatorVeg: {
    borderColor: colors.veg,
  },
  vegIndicatorNonVeg: {
    borderColor: colors.nonVeg,
  },
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vegDotVeg: {
    backgroundColor: colors.veg,
  },
  vegDotNonVeg: {
    backgroundColor: colors.nonVeg,
  },
  vegFilterText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  vegFilterTextActive: {
    color: colors.veg,
  },
  nonvegFilterTextActive: {
    color: colors.nonVeg,
  },
  menuContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  clearFilterText: {
    ...textStyles.label,
    color: colors.primary,
    marginTop: spacing.md,
  },
});
