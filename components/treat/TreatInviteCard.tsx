import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { TreatRoom } from '../../services/treatMode';

interface Props {
  invite: TreatRoom;
  onAccept: () => void;
  onDecline: () => void;
}

export function TreatInviteCard({ invite, onAccept, onDecline }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
      <View style={styles.header}>
        <Ionicons name="people" size={20} color={colors.warning} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Treat Invite!</Text>
      </View>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {invite.hostName} wants to treat you at {invite.restaurantName}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.declineBtn, { borderColor: colors.gray300 }]} onPress={onDecline}>
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.warning }]} onPress={onAccept}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...textStyles.label, fontWeight: '600' },
  message: { ...textStyles.body, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  declineBtn: { borderWidth: 1 },
  btnText: { ...textStyles.label },
});
