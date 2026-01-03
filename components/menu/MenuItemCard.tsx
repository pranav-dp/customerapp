import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { formatPrice } from '../../utils/restaurant';
import { FriendBoughtBadge } from './FriendBoughtBadge';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isVeg?: boolean;
  rating?: number;
  ratingCount?: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onPress: () => void;
  onAddToCart: () => void;
  disabled?: boolean;
  friendBought?: { friendName: string; timeAgo: string } | null;
}

export default function MenuItemCard({ item, onPress, onAddToCart, disabled = false, friendBought }: MenuItemCardProps) {
  const colors = useColors();
  const isUnavailable = !item.isAvailable || disabled;
  const isVeg = item.isVeg !== false;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }, isUnavailable && styles.containerDisabled]} 
      onPress={onPress}
      activeOpacity={isUnavailable ? 1 : 0.7}
      disabled={isUnavailable}
    >
      <View style={styles.content}>
        {/* Veg/Non-veg indicator */}
        <View style={[styles.vegIndicator, { borderColor: isVeg ? colors.veg : colors.nonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: isVeg ? colors.veg : colors.nonVeg }]} />
        </View>

        <Text style={[styles.name, { color: colors.textPrimary }, isUnavailable && { color: colors.textDisabled }]} numberOfLines={2}>
          {item.name}
        </Text>

        {item.description && (
          <Text style={[styles.description, { color: colors.textSecondary }, isUnavailable && { color: colors.textDisabled }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <Text style={[styles.price, { color: colors.textPrimary }, isUnavailable && { color: colors.textDisabled }]}>
          {formatPrice(item.price)}
        </Text>

        {/* Friend bought badge */}
        {friendBought && !isUnavailable && (
          <FriendBoughtBadge friendName={friendBought.friendName} timeAgo={friendBought.timeAgo} />
        )}

        {/* Item Rating */}
        {item.rating !== undefined && item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.warning }]}>{item.rating.toFixed(1)}</Text>
            {item.ratingCount !== undefined && item.ratingCount > 0 && (
              <Text style={[styles.ratingCount, { color: colors.textTertiary }]}>({item.ratingCount})</Text>
            )}
          </View>
        )}
      </View>

      {/* Image or placeholder */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={[styles.image, isUnavailable && styles.imageDisabled]} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.gray100 }, isUnavailable && styles.imageDisabled]}>
            <Ionicons name="restaurant" size={32} color={colors.gray400} />
          </View>
        )}

        {/* Out of stock overlay */}
        {!item.isAvailable && (
          <View style={[styles.outOfStockBadge, { backgroundColor: colors.gray800 }]}>
            <Text style={[styles.outOfStockText, { color: colors.white }]}>Out of stock</Text>
          </View>
        )}

        {/* Add button - only show if available and restaurant open */}
        {item.isAvailable && !disabled && (
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.white, borderColor: colors.success }, shadows.md]} onPress={onAddToCart} activeOpacity={0.8}>
            <Text style={[styles.addButtonText, { color: colors.success }]}>ADD</Text>
            <Ionicons name="add" size={14} color={colors.success} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  containerDisabled: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingRight: spacing.md,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    ...textStyles.h4,
    marginBottom: spacing.xs,
  },
  description: {
    ...textStyles.bodySmall,
    marginBottom: spacing.sm,
  },
  price: {
    ...textStyles.label,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: 2,
  },
  ratingText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  ratingCount: {
    ...textStyles.caption,
  },
  imageContainer: {
    position: 'relative',
    width: 110,
    height: 100,
  },
  image: {
    width: 110,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  imageDisabled: {
    opacity: 0.4,
  },
  imagePlaceholder: {
    width: 110,
    height: 100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  outOfStockText: {
    ...textStyles.labelSmall,
    fontSize: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: [{ translateX: -35 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  addButtonText: {
    ...textStyles.buttonSmall,
    marginRight: 2,
  },
});
