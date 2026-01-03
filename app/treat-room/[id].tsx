import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../contexts/AuthContext';
import { TreatRoom, subscribeToTreatRoom, lockTreatRoom, cancelTreatRoom, removeFromTreatCart } from '../../services/treatMode';
import { Button } from '../../components/ui';

export default function TreatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { customer } = useAuth();
  const [room, setRoom] = useState<TreatRoom | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToTreatRoom(id, setRoom);
    return () => unsub();
  }, [id]);

  const isHost = room?.hostId === customer?.id;
  const participants = room?.invitedFriends.filter(f => f.status === 'joined') || [];

  const handleLock = async () => {
    if (!id) return;
    await lockTreatRoom(id);
  };

  const handleCancel = () => {
    Alert.alert('Cancel Treat?', 'This will end the treat session for everyone.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        if (id) await cancelTreatRoom(id);
        router.back();
      }},
    ]);
  };

  const handleCheckout = () => {
    router.push({ pathname: '/treat-checkout' as any, params: { roomId: id } });
  };

  if (!room) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 100 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (room.status === 'cancelled') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.centered}>
          <Ionicons name="close-circle" size={64} color={colors.error} />
          <Text style={[styles.cancelledText, { color: colors.textPrimary }]}>Treat Cancelled</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.warning }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isHost ? 'Your Treat' : `${room.hostName}'s Treat`}</Text>
          <Text style={styles.headerSubtitle}>{room.restaurantName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Participants */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Participants</Text>
          <View style={styles.participants}>
            <View style={[styles.participant, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.participantName, { color: colors.primary }]}>{room.hostName} (Host)</Text>
            </View>
            {participants.map(p => (
              <View key={p.id} style={[styles.participant, { backgroundColor: colors.gray100 }]}>
                <Text style={[styles.participantName, { color: colors.textPrimary }]}>{p.name}</Text>
              </View>
            ))}
            {room.invitedFriends.filter(f => f.status === 'pending').map(p => (
              <View key={p.id} style={[styles.participant, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.participantName, { color: colors.warning }]}>{p.name} (pending)</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cart */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cart</Text>
          {room.cart.length === 0 ? (
            <Text style={[styles.emptyCart, { color: colors.textTertiary }]}>
              {room.status === 'open' ? 'Go to the restaurant page to add items!' : 'No items added'}
            </Text>
          ) : (
            room.cart.map((item, idx) => (
              <View key={idx} style={[styles.cartItem, { borderBottomColor: colors.gray100 }]}>
                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.veg : colors.nonVeg }]} />
                <View style={styles.cartItemInfo}>
                  <Text style={[styles.cartItemName, { color: colors.textPrimary }]}>{item.quantity}x {item.name}</Text>
                  <Text style={[styles.cartItemBy, { color: colors.textTertiary }]}>Added by {item.addedBy.name}</Text>
                </View>
                <Text style={[styles.cartItemPrice, { color: colors.textPrimary }]}>₹{item.price * item.quantity}</Text>
                {(isHost || item.addedBy.id === customer?.id) && room.status === 'open' && (
                  <TouchableOpacity onPress={() => removeFromTreatCart(room.id, item.itemId, item.addedBy.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Total */}
        <View style={[styles.section, { backgroundColor: colors.white }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>₹{room.totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      {isHost && (
        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.gray100 }]}>
          {room.status === 'open' ? (
            <>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.error }]} onPress={handleCancel}>
                <Text style={[styles.cancelBtnText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.lockBtn, { backgroundColor: room.cart.length > 0 ? colors.warning : colors.gray300 }]} 
                onPress={handleLock}
                disabled={room.cart.length === 0}
              >
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.lockBtnText}>Lock & Pay</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Button title="Proceed to Payment" onPress={handleCheckout} fullWidth />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  cancelledText: { ...textStyles.h2, marginTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { ...textStyles.h3, color: '#fff' },
  headerSubtitle: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)' },
  section: { margin: spacing.md, marginBottom: 0, padding: spacing.md, borderRadius: borderRadius.lg },
  sectionTitle: { ...textStyles.label, marginBottom: spacing.sm },
  participants: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  participant: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  participantName: { ...textStyles.caption },
  emptyCart: { ...textStyles.body, textAlign: 'center', paddingVertical: spacing.lg },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, gap: spacing.sm },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  cartItemInfo: { flex: 1 },
  cartItemName: { ...textStyles.body },
  cartItemBy: { ...textStyles.caption },
  cartItemPrice: { ...textStyles.label },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { ...textStyles.h3 },
  totalValue: { ...textStyles.h2 },
  footer: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm, borderTopWidth: 1 },
  cancelBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { ...textStyles.label },
  lockBtn: { flex: 2, flexDirection: 'row', paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  lockBtnText: { ...textStyles.label, color: '#fff' },
});
