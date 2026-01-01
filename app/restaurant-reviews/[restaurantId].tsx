import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';
import { getReviewsByRestaurant, Review } from '../../services/reviews';
import { StarRating } from '../../components/StarRating';
import { ReviewCard } from '../../components/ReviewCard';
import { Skeleton } from '../../components/ui';

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

export default function RestaurantReviewsScreen() {
  const { restaurantId, restaurantName, rating, reviewCount } = useLocalSearchParams<{ 
    restaurantId: string; 
    restaurantName: string;
    rating: string;
    reviewCount: string;
  }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');

  const fetchReviews = useCallback(async () => {
    if (!restaurantId) return;
    
    const result = await getReviewsByRestaurant(restaurantId);
    if (result.success) {
      setReviews(result.data);
    }
    setLoading(false);
  }, [restaurantId]);

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

  const avgRating = parseFloat(rating || '0');
  const totalReviews = parseInt(reviewCount || '0');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>{restaurantName || 'Reviews'}</Text>
          <View style={styles.ratingRow}>
            <StarRating rating={Math.round(avgRating)} size={14} readonly />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)} • {totalReviews} reviews</Text>
          </View>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Rating Filters */}
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

      {/* Sort Filters */}
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <>
            <Skeleton width="100%" height={180} style={{ marginBottom: spacing.md, borderRadius: borderRadius.xl }} />
            <Skeleton width="100%" height={180} style={{ marginBottom: spacing.md, borderRadius: borderRadius.xl }} />
            <Skeleton width="100%" height={180} style={{ marginBottom: spacing.md, borderRadius: borderRadius.xl }} />
          </>
        ) : filteredAndSortedReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No reviews found</Text>
            <Text style={styles.emptyText}>
              {ratingFilter !== 'all' 
                ? `No ${ratingFilter}★ reviews found. Try a different filter.`
                : 'Be the first to review this restaurant!'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredAndSortedReviews.length} {filteredAndSortedReviews.length === 1 ? 'review' : 'reviews'}
              {ratingFilter !== 'all' && ` with ${ratingFilter}★`}
            </Text>
            {filteredAndSortedReviews.map(review => (
              <ReviewCard key={review.id} review={review} showRestaurantName={false} />
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
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { ...textStyles.h4, color: colors.textPrimary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  ratingText: { ...textStyles.caption, color: colors.textSecondary, marginLeft: spacing.sm },
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
  emptyTitle: { ...textStyles.h3, color: colors.textPrimary, marginTop: spacing.lg },
  emptyText: { 
    ...textStyles.body, 
    color: colors.textSecondary, 
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
});
