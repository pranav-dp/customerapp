import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { getRestaurant } from '../../services/firestore';
import { getRestaurantStatus, formatPrice, OperatingHours } from '../../utils/restaurant';
import { MenuItemCard, CategoryTabs, ClosedBanner, MenuItem } from '../../components/menu';
import { CartBar } from '../../components/cart';
import { Skeleton } from '../../components/ui';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toggleFavorite } from '../../services/friends';
import { StarRating } from '../../components/StarRating';
import * as Haptics from 'expo-haptics';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  heroImage?: string;
  operatingHours?: OperatingHours;
  menu?: MenuItem[];
  rating?: number;
  reviewCount?: number;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { addItem, restaurantId: cartRestaurantId, totalItems } = useCart();
  const { customer, refreshCustomer } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [filter, setFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  const isFavorite = customer?.favorites?.includes(id || '') || false;

  const handleToggleFavorite = async () => {
    if (!customer?.id || !id) return;
    await toggleFavorite(customer.id, id, isFavorite);
    refreshCustomer?.();
  };

  const handleViewReviews = () => {
    if (!restaurant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/restaurant-reviews/[restaurantId]',
      params: { 
        restaurantId: restaurant.id, 
        restaurantName: restaurant.name,
        rating: String(restaurant.rating || 0),
        reviewCount: String(restaurant.reviewCount || 0),
      }
    } as any);
  };

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.gray100 }]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="sad-outline" size={48} color={colors.gray300} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Restaurant not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const availableCount = restaurant.menu?.filter(i => i.isAvailable).length || 0;
  const totalCount = restaurant.menu?.length || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFavorite} style={[styles.searchButton, { backgroundColor: colors.gray100 }]}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? colors.error : colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{restaurant.name}</Text>
          {restaurant.description && (
            <Text style={[styles.restaurantDescription, { color: colors.textSecondary }]}>{restaurant.description}</Text>
          )}
          
          {/* Reviews Section - Tappable */}
          <TouchableOpacity style={[styles.reviewsSection, { backgroundColor: colors.gray50 }]} onPress={handleViewReviews} activeOpacity={0.7}>
            <View style={styles.reviewsLeft}>
              <StarRating 
                rating={Math.round(restaurant.rating || 0)} 
                size={16} 
                readonly 
              />
              <Text style={[styles.reviewsText, { color: colors.textSecondary }]}>
                {(restaurant.rating || 0).toFixed(1)} ({restaurant.reviewCount || 0} reviews)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          
          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: status.isOpen ? colors.successLight : colors.errorLight }]}>
              <View style={[styles.statusDot, { backgroundColor: status.isOpen ? colors.success : colors.error }]} />
              <Text style={[styles.statusText, { color: status.isOpen ? colors.success : colors.error }]}>
                {status.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
            <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>{status.message}</Text>
          </View>

          {/* Menu Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{availableCount} items available</Text>
            </View>
            {totalCount > availableCount && (
              <Text style={[styles.unavailableText, { color: colors.textTertiary }]}>
                {totalCount - availableCount} unavailable
              </Text>
            )}
          </View>
        </View>

        {/* Closed Banner */}
        <ClosedBanner status={status} />

        {/* Filters & Categories - Sticky */}
        <View style={[styles.filtersContainer, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          {/* Veg/Non-veg Filter */}
          <View style={styles.vegFilters}>
            <TouchableOpacity
              style={[
                styles.vegFilterButton, 
                { borderColor: colors.gray200, backgroundColor: colors.white },
                filter === 'veg' && { borderColor: colors.veg, backgroundColor: colors.successLight }
              ]}
              onPress={() => setFilter(filter === 'veg' ? 'all' : 'veg')}
            >
              <View style={[styles.vegIndicator, { borderColor: colors.veg }]}>
                <View style={[styles.vegDot, { backgroundColor: colors.veg }]} />
              </View>
              <Text style={[styles.vegFilterText, { color: filter === 'veg' ? colors.veg : colors.textSecondary }]}>Veg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.vegFilterButton, 
                { borderColor: colors.gray200, backgroundColor: colors.white },
                filter === 'nonveg' && { borderColor: colors.nonVeg, backgroundColor: colors.errorLight }
              ]}
              onPress={() => setFilter(filter === 'nonveg' ? 'all' : 'nonveg')}
            >
              <View style={[styles.vegIndicator, { borderColor: colors.nonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: colors.nonVeg }]} />
              </View>
              <Text style={[styles.vegFilterText, { color: filter === 'nonveg' ? colors.nonVeg : colors.textSecondary }]}>Non-veg</Text>
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items found</Text>
              {filter !== 'all' && (
                <TouchableOpacity onPress={() => setFilter('all')}>
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear filters</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  restaurantInfo: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  restaurantName: {
    ...textStyles.displayMedium,
    marginBottom: spacing.xs,
  },
  restaurantDescription: {
    ...textStyles.body,
    marginBottom: spacing.md,
  },
  reviewsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  reviewsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    ...textStyles.bodySmall,
    marginLeft: spacing.sm,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    ...textStyles.labelSmall,
  },
  statusMessage: {
    ...textStyles.bodySmall,
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
    marginLeft: spacing.xs,
  },
  unavailableText: {
    ...textStyles.bodySmall,
    marginLeft: spacing.md,
  },
  filtersContainer: {
    borderBottomWidth: 1,
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
  vegDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vegFilterText: {
    ...textStyles.labelSmall,
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
  },
  clearFilterText: {
    ...textStyles.label,
    marginTop: spacing.md,
  },
});
