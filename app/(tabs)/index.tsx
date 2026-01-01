import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useColors } from '../../hooks/useColors';
import { getRestaurants } from '../../services/firestore';
import { getRestaurantStatus, OperatingHours } from '../../utils/restaurant';
import { Skeleton } from '../../components/ui';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  heroImage?: string;
  operatingHours?: OperatingHours;
  menu?: any[];
  rating?: number;
  reviewCount?: number;
}

function RestaurantCard({ restaurant, onPress, colors }: { restaurant: Restaurant; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  const status = getRestaurantStatus(restaurant.operatingHours);
  const menuCount = restaurant.menu?.filter(i => i.isAvailable).length || 0;
  const rating = restaurant.rating || 0;
  const reviewCount = restaurant.reviewCount || 0;

  return (
    <TouchableOpacity style={[styles.restaurantCard, { backgroundColor: colors.white }, shadows.md]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.restaurantImagePlaceholder, { backgroundColor: colors.gray100 }]}>
        <Ionicons name="storefront" size={36} color={colors.gray400} />
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={[styles.restaurantName, { color: colors.textPrimary }]} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={[styles.restaurantMeta, { color: colors.textSecondary }]} numberOfLines={1}>
          {menuCount > 0 ? `${menuCount} items available` : restaurant.description || 'Menu coming soon'}
        </Text>
        <View style={styles.restaurantStatus}>
          <View style={[styles.statusDot, { backgroundColor: status.isOpen ? colors.success : colors.error }]} />
          <Text style={[styles.statusText, { color: status.isOpen ? colors.success : colors.error }]} numberOfLines={1}>
            {status.isOpen ? 'Open now' : status.message}
          </Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name={rating > 0 ? "star" : "star-outline"} size={14} color={rating > 0 ? colors.warning : colors.gray400} />
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
            {rating > 0 ? `${rating.toFixed(1)} (${reviewCount})` : 'No reviews yet'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

function RestaurantSkeleton({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.restaurantCard, { backgroundColor: colors.white }]}>
      <Skeleton width={80} height={80} borderRadius={borderRadius.lg} />
      <View style={styles.restaurantInfo}>
        <Skeleton width={140} height={18} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
        <Skeleton width={70} height={14} />
      </View>
    </View>
  );
}

interface SearchResult {
  item: any;
  restaurant: Restaurant;
}

export default function HomeScreen() {
  const { customer } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const firstName = customer?.name?.split(' ')[0] || 'there';

  const fetchData = async () => {
    const result = await getRestaurants();
    if (result.success && result.data) {
      setRestaurants(result.data as Restaurant[]);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search through all menu items
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    
    restaurants.forEach(restaurant => {
      const status = getRestaurantStatus(restaurant.operatingHours);
      if (!status.isOpen) return; // Only search open restaurants
      
      restaurant.menu?.forEach(item => {
        if (item.isAvailable && item.name.toLowerCase().includes(query)) {
          results.push({ item, restaurant });
        }
      });
    });
    
    setSearchResults(results.slice(0, 20)); // Limit results
  }, [searchQuery, restaurants]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>Hi, {firstName}! 👋</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>What would you like to eat?</Text>
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="search" size={20} color={colors.gray500} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search for dishes..."
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {searchQuery.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {searchResults.length > 0 ? `Found ${searchResults.length} items` : 'No items found'}
            </Text>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={`${result.restaurant.id}-${result.item.id}-${index}`}
                style={[styles.searchResultCard, { backgroundColor: colors.white, borderColor: colors.gray100 }]}
                onPress={() => router.push(`/restaurant/${result.restaurant.id}`)}
              >
                <View style={styles.searchResultLeft}>
                  <View style={[styles.vegIndicator, { borderColor: result.item.isVeg ? colors.veg : colors.nonVeg }]}>
                    <View style={[styles.vegDot, { backgroundColor: result.item.isVeg ? colors.veg : colors.nonVeg }]} />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: colors.textPrimary }]}>{result.item.name}</Text>
                    <Text style={[styles.searchResultRestaurant, { color: colors.textSecondary }]}>{result.restaurant.name}</Text>
                  </View>
                </View>
                <Text style={[styles.searchResultPrice, { color: colors.success }]}>₹{result.item.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="fast-food" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="leaf" size={24} color={colors.veg} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="nutrition" size={24} color={colors.nonVeg} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Non-Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="cafe" size={24} color={colors.warning} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Drinks</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Campus Restaurants</Text>
            <Text style={[styles.restaurantCount, { color: colors.textTertiary }]}>{restaurants.length} available</Text>
          </View>

          {loading ? (
            <>
              <RestaurantSkeleton colors={colors} />
              <RestaurantSkeleton colors={colors} />
            </>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => router.push(`/restaurant/${restaurant.id}`)}
                colors={colors}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={colors.gray300} />
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No restaurants available yet</Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight }]}>
          <View style={[styles.infoBannerIcon, { backgroundColor: colors.white }]}>
            <Ionicons name="flash" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={[styles.infoBannerTitle, { color: colors.textPrimary }]}>Skip the queue!</Text>
            <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>Order ahead and pick up when ready</Text>
          </View>
        </View>
        </>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    ...textStyles.h1,
  },
  subGreeting: {
    ...textStyles.body,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    marginLeft: spacing.md,
    paddingVertical: 0,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  searchResultInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  searchResultName: {
    ...textStyles.label,
  },
  searchResultRestaurant: {
    ...textStyles.caption,
  },
  searchResultPrice: {
    ...textStyles.label,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    ...textStyles.labelSmall,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h2,
  },
  restaurantCount: {
    ...textStyles.labelSmall,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  restaurantImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  restaurantName: {
    ...textStyles.h4,
  },
  restaurantMeta: {
    ...textStyles.bodySmall,
    marginTop: spacing.xs,
  },
  restaurantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    ...textStyles.labelSmall,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: {
    ...textStyles.caption,
    marginLeft: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...textStyles.body,
  },
  infoBanner: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  infoBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerContent: {
    flex: 1,
    marginLeft: spacing.lg,
    justifyContent: 'center',
  },
  infoBannerTitle: {
    ...textStyles.h4,
  },
  infoBannerText: {
    ...textStyles.bodySmall,
    marginTop: spacing.xs,
  },
});
