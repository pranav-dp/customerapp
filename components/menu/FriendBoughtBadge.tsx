import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';

interface FriendBoughtBadgeProps {
  friendName: string;
  timeAgo: string;
}

export function FriendBoughtBadge({ friendName, timeAgo }: FriendBoughtBadgeProps) {
  const colors = useColors();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.primaryLight }]}>
      <Ionicons name="person-circle-outline" size={12} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primaryDark }]} numberOfLines={1}>
        {friendName} ordered {timeAgo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  text: {
    ...textStyles.caption,
    fontSize: 10,
  },
});
