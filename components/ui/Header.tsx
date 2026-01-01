import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  transparent?: boolean;
}

export default function Header({
  title,
  showBack = false,
  onBackPress,
  rightIcon,
  onRightPress,
  transparent = false,
}: HeaderProps) {
  const colors = useColors();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: colors.white, borderBottomColor: colors.gray100 },
      transparent && styles.transparent
    ]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
      <View style={styles.right}>
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  left: {
    width: 44,
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  title: {
    ...textStyles.h3,
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
});
