import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  itemCounts: Record<string, number>;
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange, itemCounts }: CategoryTabsProps) {
  const scrollRef = useRef<ScrollView>(null);
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
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
              style={[styles.tab, { backgroundColor: isActive ? colors.textPrimary : colors.gray100 }]}
              onPress={() => onCategoryChange(category)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: isActive ? colors.white : colors.textSecondary }]}>
                {category}
              </Text>
              <Text style={[styles.tabCount, { color: isActive ? colors.gray400 : colors.textTertiary }]}>
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
    borderBottomWidth: 1,
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
    marginRight: spacing.sm,
  },
  tabText: {
    ...textStyles.label,
  },
  tabCount: {
    ...textStyles.labelSmall,
    marginLeft: spacing.xs,
  },
});
