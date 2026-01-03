import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { TreatRoom } from '../../services/treatMode';

interface Props {
  room: TreatRoom;
  isHost: boolean;
}

export function TreatBanner({ room, isHost }: Props) {
  const colors = useColors();
  const router = useRouter();
  const participantCount = room.invitedFriends.filter(f => f.status === 'joined').length + 1;

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.warning }]}
      onPress={() => router.push(`/treat-room/${room.id}` as any)}
    >
      <View style={styles.left}>
        <Ionicons name="people" size={20} color="#fff" />
        <View>
          <Text style={styles.title}>
            {isHost ? 'You\'re treating!' : `${room.hostName}'s treat`}
          </Text>
          <Text style={styles.subtitle}>
            {participantCount} people · ₹{room.totalAmount}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: spacing.md, 
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...textStyles.label, color: '#fff', fontWeight: '600' },
  subtitle: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)' },
});
