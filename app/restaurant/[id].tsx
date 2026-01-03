import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { useVegFilter } from '../../contexts/VegFilterContext';
import { getRestaurant } from '../../services/firestore';
import { getRestaurantStatus, formatPrice, OperatingHours } from '../../utils/restaurant';
import { MenuItemCard, CategoryTabs, ClosedBanner, MenuItem, VegToggle, SuggestedComboCard } from '../../components/menu';
import { CartBar } from '../../components/cart';
import { Skeleton } from '../../components/ui';
import { BusynessIndicator } from '../../components/restaurant';
import { TreatBanner } from '../../components/treat';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toggleFavorite } from '../../services/friends';
import { getFriendsWhoOrdered, formatTimeAgo } from '../../services/friendsOrders';
import { getRestaurantStats, getBusynessInfo, RestaurantStats } from '../../services/busyness';
import { getSuggestedCombo, SuggestedCombo } from '../../services/suggestions';
import { getMyActiveTreatRoom, addToTreatCart, TreatRoom } from '../../services/treatMode';
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
  stats?: RestaurantStats;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { vegFilter, setVegFilter } = useVegFilter();
  const { addItem, restaurantId: cartRestaurantId, totalItems } = useCart();
  const { customer, refreshCustomer } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [friendsOrders, setFriendsOrders] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [suggestedCombo, setSuggestedCombo] = useState<SuggestedCombo | null>(null);
  const [activeTreat, setActiveTreat] = useState<TreatRoom | null>(null);
  const [addToTreat, setAddToTreat] = useState(false); // Toggle: add to treat cart or personal cart

  const isFavorite = customer?.favorites?.includes(id || '') || false;
  const busyness = getBusynessInfo(stats);
  const inTreatMode = activeTreat && activeTreat.restaurantId === id;

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
      
      // Fetch busyness stats
      const statsResult = await getRestaurantStats(id);
      setStats(statsResult);
      setLoading(false);
    };
    fetchRestaurant();
  }, [id]);

  // Fetch friends' orders for this restaurant
  useEffect(() => {
    const fetchFriendsOrders = async () => {
      if (!id || !customer?.friends?.length) return;
      const friendIds = customer.friends.map((f: any) => f.odid).filter(Boolean);
      if (friendIds.length === 0) return;
      const result = await getFriendsWhoOrdered(id, friendIds);
      if (result.success && result.data) {
        setFriendsOrders(result.data);
      }
    };
    fetchFriendsOrders();
  }, [id, customer?.friends]);

  // Fetch suggested combo
  useEffect(() => {
    const fetchCombo = async () => {
      if (!id || !customer?.id) return;
      const combo = await getSuggestedCombo(customer.id, id);
      setSuggestedCombo(combo);
    };
    fetchCombo();
  }, [id, customer?.id]);

  // Subscribe to active treat room
  useEffect(() => {
    if (!customer?.id) return;
    const unsub = getMyActiveTreatRoom(customer.id, setActiveTreat);
    return () => unsub();
  }, [customer?.id]);

  const status = useMemo(() => {
    return getRestaurantStatus(restaurant?.operatingHours);
  }, [restaurant?.operatingHours]);

  // Process menu: filter, sort (unavailable at bottom), group by category
  const { categories, filteredMenu, itemCounts } = useMemo(() => {
    if (!restaurant?.menu) return { categories: ['All'], filteredMenu: [], itemCounts: { All: 0 } };

    let items = [...restaurant.menu];

    // Apply veg/nonveg filter (treat undefined/null isVeg as veg for old items)
    if (vegFilter === 'veg') {
      items = items.filter(item => item.isVeg !== false);
    } else if (vegFilter === 'nonveg') {
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
  }, [restaurant?.menu, activeCategory, vegFilter]);

  const handleAddToCart = async (item: MenuItem) => {
    if (!status.isOpen) {
      Alert.alert('Restaurant Closed', status.message);
      return;
    }
    if (!restaurant) return;
    
    // If toggle is on "For Treat" and in treat mode, add to treat cart
    if (addToTreat && inTreatMode && activeTreat && customer) {
      await addToTreatCart(activeTreat.id, {
        itemId: item.id,
        name: item.name,
        price: item.price,
        isVeg: item.isVeg ?? true,
        addedBy: { id: customer.id, name: customer.name },
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    
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
            {status.isOpen && (
              <BusynessIndicator level={busyness.level} label={busyness.label} waitTime={busyness.waitTime} compact />
            )}
          </View>
          {status.isOpen && (
            <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>{status.message}</Text>
          )}

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

        {/* Treat Banner */}
        {inTreatMode && activeTreat && (
          <TreatBanner room={activeTreat} isHost={activeTreat.hostId === customer?.id} />
        )}

        {/* Start Treat Button */}
        {!inTreatMode && status.isOpen && (
          <TouchableOpacity 
            style={[styles.treatButton, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
            onPress={() => {
              if ((customer?.friends?.length ?? 0) === 0) {
                Alert.alert('Add Friends First', 'You need friends to start a treat!', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Add Friends', onPress: () => router.push('/friends') }
                ]);
                return;
              }
              router.push({ pathname: '/treat-room/create' as any, params: { restaurantId: id, restaurantName: restaurant?.name } });
            }}
          >
            <Ionicons name="people" size={18} color={colors.warning} />
            <Text style={[styles.treatButtonText, { color: colors.warning }]}>Start a Treat</Text>
          </TouchableOpacity>
        )}

        {/* Closed Banner */}
        <ClosedBanner status={status} />

        {/* Filters & Categories - Sticky */}
        <View style={[styles.filtersContainer, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          {/* Treat Mode Toggle */}
          {inTreatMode && (
            <View style={[styles.treatToggleContainer, { borderBottomColor: colors.gray100 }]}>
              <Text style={[styles.treatToggleLabel, { color: colors.textSecondary }]}>Add items to:</Text>
              <View style={[styles.treatToggle, { backgroundColor: colors.gray100 }]}>
                <TouchableOpacity 
                  style={[styles.treatToggleBtn, !addToTreat && { backgroundColor: colors.success }]}
                  onPress={() => setAddToTreat(false)}
                >
                  <Text style={[styles.treatToggleBtnText, { color: !addToTreat ? '#fff' : colors.textSecondary }]}>For Me</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.treatToggleBtn, addToTreat && { backgroundColor: colors.warning }]}
                  onPress={() => setAddToTreat(true)}
                >
                  <Ionicons name="people" size={14} color={addToTreat ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.treatToggleBtnText, { color: addToTreat ? '#fff' : colors.textSecondary }]}>For Treat</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Veg/Non-veg Filter */}
          <View style={styles.vegFilters}>
            <VegToggle value={vegFilter} onChange={setVegFilter} />
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
          {/* Suggested Combo */}
          {suggestedCombo && activeCategory === 'All' && (
            <SuggestedComboCard
              combo={suggestedCombo}
              onAdd={() => {
                suggestedCombo.items.forEach(item => {
                  const menuItem = restaurant?.menu?.find(m => m.id === item.id);
                  if (menuItem) handleAddToCart(menuItem);
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
          )}
          
          {filteredMenu.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Ionicons name="restaurant-outline" size={48} color={colors.gray300} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No items found</Text>
              {vegFilter !== 'all' && (
                <TouchableOpacity onPress={() => setVegFilter('all')}>
                  <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredMenu.map((item) => {
              const friendOrder = friendsOrders[item.id];
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onPress={() => {/* TODO: Item detail modal */}}
                  onAddToCart={() => handleAddToCart(item)}
                  disabled={!status.isOpen}
                  friendBought={friendOrder ? { 
                    friendName: friendOrder.friendName, 
                    timeAgo: formatTimeAgo(friendOrder.orderedAt) 
                  } : null}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      <CartBar treatRoom={inTreatMode ? activeTreat : null} />
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  treatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  treatButtonText: {
    ...textStyles.label,
    fontWeight: '600',
  },
  treatToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  treatToggleLabel: {
    ...textStyles.caption,
  },
  treatToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 2,
  },
  treatToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  treatToggleBtnText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
});
