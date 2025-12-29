import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
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
}

function RestaurantCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const status = getRestaurantStatus(restaurant.operatingHours);
  const menuCount = restaurant.menu?.filter(i => i.isAvailable).length || 0;

  return (
    <TouchableOpacity style={styles.restaurantCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.restaurantImagePlaceholder}>
        <Ionicons name="storefront" size={36} color={colors.gray400} />
      </View>
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
        <Text style={styles.restaurantMeta} numberOfLines={1}>
          {menuCount > 0 ? `${menuCount} items available` : restaurant.description || 'Menu coming soon'}
        </Text>
        <View style={styles.restaurantStatus}>
          <View style={[styles.statusDot, !status.isOpen && styles.statusDotClosed]} />
          <Text style={[styles.statusText, !status.isOpen && styles.statusTextClosed]} numberOfLines={1}>
            {status.isOpen ? 'Open now' : status.message}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

function RestaurantSkeleton() {
  return (
    <View style={styles.restaurantCard}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {firstName}! 👋</Text>
            <Text style={styles.subGreeting}>What would you like to eat?</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray500} />
          <TextInput
            style={styles.searchInput}
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
            <Text style={styles.sectionTitle}>
              {searchResults.length > 0 ? `Found ${searchResults.length} items` : 'No items found'}
            </Text>
            {searchResults.map((result, index) => (
              <TouchableOpacity
                key={`${result.restaurant.id}-${result.item.id}-${index}`}
                style={styles.searchResultCard}
                onPress={() => router.push(`/restaurant/${result.restaurant.id}`)}
              >
                <View style={styles.searchResultLeft}>
                  <View style={[styles.vegIndicator, result.item.isVeg ? styles.vegVeg : styles.vegNonVeg]}>
                    <View style={[styles.vegDot, result.item.isVeg ? styles.dotVeg : styles.dotNonVeg]} />
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{result.item.name}</Text>
                    <Text style={styles.searchResultRestaurant}>{result.restaurant.name}</Text>
                  </View>
                </View>
                <Text style={styles.searchResultPrice}>₹{result.item.price}</Text>
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
            <Text style={styles.quickActionText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf" size={24} color={colors.veg} />
            </View>
            <Text style={styles.quickActionText}>Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="nutrition" size={24} color={colors.nonVeg} />
            </View>
            <Text style={styles.quickActionText}>Non-Veg</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionItem}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="cafe" size={24} color={colors.warning} />
            </View>
            <Text style={styles.quickActionText}>Drinks</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurants Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Campus Restaurants</Text>
            <Text style={styles.restaurantCount}>{restaurants.length} available</Text>
          </View>

          {loading ? (
            <>
              <RestaurantSkeleton />
              <RestaurantSkeleton />
            </>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => router.push(`/restaurant/${restaurant.id}`)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No restaurants available yet</Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoBannerIcon}>
            <Ionicons name="flash" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Skip the queue!</Text>
            <Text style={styles.infoBannerText}>Order ahead and pick up when ready</Text>
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
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
  },
  subGreeting: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.xl,
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    paddingVertical: 0,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray100,
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
  vegVeg: { borderColor: colors.veg },
  vegNonVeg: { borderColor: colors.nonVeg },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  dotVeg: { backgroundColor: colors.veg },
  dotNonVeg: { backgroundColor: colors.nonVeg },
  searchResultInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  searchResultName: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  searchResultRestaurant: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  searchResultPrice: {
    ...textStyles.label,
    color: colors.success,
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
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },
  restaurantCount: {
    ...textStyles.labelSmall,
    color: colors.textTertiary,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  restaurantImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  restaurantName: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  restaurantMeta: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
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
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  statusDotClosed: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...textStyles.labelSmall,
    color: colors.success,
  },
  statusTextClosed: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textTertiary,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  infoBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
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
    color: colors.textPrimary,
  },
  infoBannerText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
