import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { StarRating } from './StarRating';
import { Review } from '../services/reviews';

interface ReviewCardProps {
  review: Review;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  showRestaurantName?: boolean;
  key?: string;
}

export function ReviewCard({ review, onDelete, showDeleteButton = false, showRestaurantName = false }: ReviewCardProps) {
  const date = review.createdAt instanceof Date 
    ? review.createdAt 
    : (review.createdAt as any)?.toDate?.() || new Date();
  
  const timeAgo = getTimeAgo(date);
  const itemsSummary = review.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  return (
    <View style={styles.container}>
      {/* Restaurant Name Header - if showing */}
      {showRestaurantName && (
        <View style={styles.restaurantHeader}>
          <View style={styles.restaurantIcon}>
            <Ionicons name="restaurant" size={16} color={colors.primary} />
          </View>
          <Text style={styles.restaurantName}>{review.restaurantName}</Text>
        </View>
      )}

      {/* User Info & Rating Row */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {review.customerName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.customerName}>{review.customerName}</Text>
            <Text style={styles.username}>@{review.username}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>{review.rating}</Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>

      {/* Review Description */}
      {review.description ? (
        <Text style={styles.description}>{review.description}</Text>
      ) : (
        <View style={styles.noDescriptionContainer}>
          <StarRating rating={review.rating} size={18} readonly />
        </View>
      )}

      {/* Photo if exists */}
      {review.photoUrl && (
        <Image
          source={{ uri: review.photoUrl }}
          style={styles.photo}
          contentFit="cover"
        />
      )}

      {/* Order Info Footer */}
      <View style={styles.footer}>
        <View style={styles.orderBadge}>
          <Ionicons name="receipt-outline" size={12} color={colors.textTertiary} />
          <Text style={styles.orderNumber}>#{review.orderNumber}</Text>
        </View>
        <Text style={styles.orderItems} numberOfLines={1}>{itemsSummary}</Text>
      </View>

      {/* Delete Button */}
      {showDeleteButton && onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  restaurantIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  restaurantName: {
    ...textStyles.label,
    color: colors.textPrimary,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: colors.black,
    fontSize: 16,
  },
  userDetails: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  customerName: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  username: {
    ...textStyles.caption,
    color: colors.textTertiary,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight || '#FFF8E1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  ratingText: {
    ...textStyles.label,
    color: colors.warning,
    fontSize: 14,
  },
  timeAgo: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  description: {
    ...textStyles.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  noDescriptionContainer: {
    marginBottom: spacing.md,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    gap: 4,
  },
  orderNumber: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  orderItems: {
    ...textStyles.caption,
    color: colors.textTertiary,
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    gap: spacing.xs,
  },
  deleteText: {
    ...textStyles.labelSmall,
    color: colors.error,
  },
});
