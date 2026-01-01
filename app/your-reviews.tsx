import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getReviewsByCustomer, deleteReview, Review } from '../services/reviews';
import { ReviewCard } from '../components/ReviewCard';
import { Skeleton } from '../components/ui';

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type SortType = 'recent' | 'oldest';

const RATING_FILTERS: { key: RatingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5★' },
  { key: '4', label: '4★' },
  { key: '3', label: '3★' },
  { key: '2', label: '2★' },
  { key: '1', label: '1★' },
];

export default function YourReviewsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    const result = await getReviewsByCustomer(user.uid);
    if (result.success) {
      setReviews(result.data);
    }
    setLoading(false);
  }, [user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReviews();
    }, [fetchReviews])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const handleRatingFilterChange = (filter: RatingFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRatingFilter(filter);
  };

  const handleSortChange = (sort: SortType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(sort);
  };

  const handleDeleteReview = (review: Review) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete your review for ${review.restaurantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteReview(review.id!, review.restaurantId, review.orderId);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setReviews(prev => prev.filter(r => r.id !== review.id));
            } else {
              Alert.alert('Error', 'Failed to delete review.');
            }
          },
        },
      ]
    );
  };

  const handleRestaurantPress = (restaurantId: string) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  // Filter and sort reviews
  const filteredAndSortedReviews = [...reviews]
    .filter(r => ratingFilter === 'all' || r.rating === parseInt(ratingFilter))
    .sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
      const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
      return sortBy === 'recent' 
        ? dateB.getTime() - dateA.getTime() 
        : dateA.getTime() - dateB.getTime();
    });

  // Calculate stats
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your Reviews</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Stats Card */}
      {!loading && reviews.length > 0 && (
        <View style={[styles.statsCard, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{reviews.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.gray200 }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{avgRating}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Rating</Text>
          </View>
        </View>
      )}

      {/* Rating Filters */}
      {!loading && reviews.length > 0 && (
        <View style={[styles.filtersContainer, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {RATING_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterBtn, { backgroundColor: colors.gray100 }, ratingFilter === filter.key && { backgroundColor: colors.primary }]}
                onPress={() => handleRatingFilterChange(filter.key)}
              >
                <Text style={[styles.filterText, { color: colors.textSecondary }, ratingFilter === filter.key && { color: colors.white }]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Filters */}
      {!loading && reviews.length > 0 && (
        <View style={[styles.sortContainer, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
          <Text style={[styles.sortLabel, { color: colors.textTertiary }]}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.gray100 }, sortBy === 'recent' && { backgroundColor: colors.textPrimary }]}
            onPress={() => handleSortChange('recent')}
          >
            <Ionicons 
              name="arrow-down" 
              size={14} 
              color={sortBy === 'recent' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.sortText, { color: colors.textSecondary }, sortBy === 'recent' && { color: colors.white }]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.gray100 }, sortBy === 'oldest' && { backgroundColor: colors.textPrimary }]}
            onPress={() => handleSortChange('oldest')}
          >
            <Ionicons 
              name="arrow-up" 
              size={14} 
              color={sortBy === 'oldest' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.sortText, { color: colors.textSecondary }, sortBy === 'oldest' && { color: colors.white }]}>
              Oldest First
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <Skeleton width="100%" height={180} style={{ marginBottom: spacing.md, borderRadius: borderRadius.xl }} />
            <Skeleton width="100%" height={180} style={{ marginBottom: spacing.md, borderRadius: borderRadius.xl }} />
          </>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.gray100 }]}>
              <Ionicons name="star-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No reviews yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your reviews will appear here after you review an order.
            </Text>
            <TouchableOpacity 
              style={[styles.reviewOrdersBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/review-orders')}
            >
              <Text style={[styles.reviewOrdersBtnText, { color: colors.white }]}>Review Your Orders</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAndSortedReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="filter-outline" size={64} color={colors.gray300} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matching reviews</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {ratingFilter}★ reviews found. Try a different filter.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {filteredAndSortedReviews.length} {filteredAndSortedReviews.length === 1 ? 'review' : 'reviews'}
              {ratingFilter !== 'all' && ` with ${ratingFilter}★`}
            </Text>
            {filteredAndSortedReviews.map(review => (
              <TouchableOpacity 
                key={review.id}
                activeOpacity={0.9}
                onPress={() => handleRestaurantPress(review.restaurantId)}
              >
                <ReviewCard 
                  review={review} 
                  showDeleteButton 
                  showRestaurantName
                  onDelete={() => handleDeleteReview(review)} 
                />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  statsCard: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
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
  filtersContainer: {
    borderBottomWidth: 1,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  filterText: {
    ...textStyles.labelSmall,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  sortLabel: {
    ...textStyles.caption,
    marginRight: spacing.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  sortText: {
    ...textStyles.caption,
  },
  content: { flex: 1, padding: spacing.lg },
  resultsCount: {
    ...textStyles.caption,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h3, marginBottom: spacing.sm },
  emptyText: { 
    ...textStyles.body, 
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  reviewOrdersBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reviewOrdersBtnText: {
    ...textStyles.label,
  },
});
