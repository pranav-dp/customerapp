import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../constants/colors';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Your Reviews</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Stats Card */}
      {!loading && reviews.length > 0 && (
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgRating}</Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>
      )}

      {/* Rating Filters */}
      {!loading && reviews.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {RATING_FILTERS.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterBtn, ratingFilter === filter.key && styles.filterBtnActive]}
                onPress={() => handleRatingFilterChange(filter.key)}
              >
                <Text style={[styles.filterText, ratingFilter === filter.key && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Filters */}
      {!loading && reviews.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'recent' && styles.sortBtnActive]}
            onPress={() => handleSortChange('recent')}
          >
            <Ionicons 
              name="arrow-down" 
              size={14} 
              color={sortBy === 'recent' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'oldest' && styles.sortBtnActive]}
            onPress={() => handleSortChange('oldest')}
          >
            <Ionicons 
              name="arrow-up" 
              size={14} 
              color={sortBy === 'oldest' ? colors.white : colors.textSecondary} 
            />
            <Text style={[styles.sortText, sortBy === 'oldest' && styles.sortTextActive]}>
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
            <View style={styles.emptyIcon}>
              <Ionicons name="star-outline" size={64} color={colors.gray300} />
            </View>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              Your reviews will appear here after you review an order.
            </Text>
            <TouchableOpacity 
              style={styles.reviewOrdersBtn}
              onPress={() => router.push('/review-orders')}
            >
              <Text style={styles.reviewOrdersBtnText}>Review Your Orders</Text>
            </TouchableOpacity>
          </View>
        ) : filteredAndSortedReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="filter-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No matching reviews</Text>
            <Text style={styles.emptyText}>
              No {ratingFilter}★ reviews found. Try a different filter.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
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
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...textStyles.h2,
    color: colors.primary,
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
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
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
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.sm,
  },
  sortLabel: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: 4,
  },
  sortBtnActive: {
    backgroundColor: colors.textPrimary,
  },
  sortText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  sortTextActive: {
    color: colors.white,
  },
  content: { flex: 1, padding: spacing.lg },
  resultsCount: {
    ...textStyles.caption,
    color: colors.textSecondary,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...textStyles.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { 
    ...textStyles.body, 
    color: colors.textSecondary, 
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  reviewOrdersBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  reviewOrdersBtnText: {
    ...textStyles.label,
    color: colors.white,
  },
});
