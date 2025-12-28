import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { formatPrice } from '../../utils/restaurant';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  isVeg?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
  onPress: () => void;
  onAddToCart: () => void;
  disabled?: boolean; // When restaurant is closed
}

export default function MenuItemCard({ item, onPress, onAddToCart, disabled = false }: MenuItemCardProps) {
  const isUnavailable = !item.isAvailable || disabled;

  return (
    <TouchableOpacity 
      style={[styles.container, isUnavailable && styles.containerDisabled]} 
      onPress={onPress}
      activeOpacity={isUnavailable ? 1 : 0.7}
      disabled={isUnavailable}
    >
      <View style={styles.content}>
        {/* Veg/Non-veg indicator */}
        <View style={[styles.vegIndicator, item.isVeg ? styles.vegIndicatorVeg : styles.vegIndicatorNonVeg]}>
          <View style={[styles.vegDot, item.isVeg ? styles.vegDotVeg : styles.vegDotNonVeg]} />
        </View>

        <Text style={[styles.name, isUnavailable && styles.textDisabled]} numberOfLines={2}>
          {item.name}
        </Text>

        {item.description && (
          <Text style={[styles.description, isUnavailable && styles.textDisabled]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <Text style={[styles.price, isUnavailable && styles.textDisabled]}>
          {formatPrice(item.price)}
        </Text>
      </View>

      {/* Image or placeholder */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={[styles.image, isUnavailable && styles.imageDisabled]} />
        ) : (
          <View style={[styles.imagePlaceholder, isUnavailable && styles.imageDisabled]}>
            <Ionicons name="restaurant" size={32} color={colors.gray400} />
          </View>
        )}

        {/* Out of stock overlay */}
        {!item.isAvailable && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        )}

        {/* Add button - only show if available and restaurant open */}
        {item.isAvailable && !disabled && (
          <TouchableOpacity style={styles.addButton} onPress={onAddToCart} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>ADD</Text>
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
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  containerDisabled: {
    opacity: 0.5,
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
  vegIndicatorVeg: {
    borderColor: colors.veg,
  },
  vegIndicatorNonVeg: {
    borderColor: colors.nonVeg,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vegDotVeg: {
    backgroundColor: colors.veg,
  },
  vegDotNonVeg: {
    backgroundColor: colors.nonVeg,
  },
  name: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  price: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  textDisabled: {
    color: colors.textDisabled,
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
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: colors.gray800,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  outOfStockText: {
    ...textStyles.labelSmall,
    color: colors.white,
    fontSize: 10,
  },
  addButton: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    transform: [{ translateX: -35 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success,
    ...shadows.md,
  },
  addButtonText: {
    ...textStyles.buttonSmall,
    color: colors.success,
    marginRight: 2,
  },
});
