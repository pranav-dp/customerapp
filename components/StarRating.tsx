import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/colors';
import { textStyles } from '../constants/typography';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showCount?: number;
  showValue?: boolean;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  size = 24, 
  readonly = false,
  showCount,
  showValue = false,
}: StarRatingProps) {
  const handlePress = (star: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(star);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={readonly}
            activeOpacity={readonly ? 1 : 0.7}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? colors.warning : colors.gray300}
            />
          </TouchableOpacity>
        ))}
      </View>
      {(showValue || showCount !== undefined) && (
        <View style={styles.infoContainer}>
          {showValue && rating > 0 && (
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          )}
          {showCount !== undefined && (
            <Text style={styles.countText}>
              ({showCount} {showCount === 1 ? 'review' : 'reviews'})
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    marginRight: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  ratingValue: {
    ...textStyles.label,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  countText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
});
