import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  itemCounts: Record<string, number>;
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange, itemCounts }: CategoryTabsProps) {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isActive = category === activeCategory;
          const count = itemCounts[category] || 0;

          return (
            <TouchableOpacity
              key={category}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onCategoryChange(category)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {category}
              </Text>
              <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>
                ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.textPrimary,
  },
  tabText: {
    ...textStyles.label,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabCount: {
    ...textStyles.labelSmall,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  tabCountActive: {
    color: colors.gray400,
  },
});
