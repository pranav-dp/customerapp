import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useColors } from '../hooks/useColors';
import { useAuth } from '../contexts/AuthContext';
import { TreatRoom, subscribeToTreatRoom, markTreatOrdered } from '../services/treatMode';
import { createOrder, updateOrderPayment } from '../services/orders';
import RazorpayService from '../services/razorpay';
import { Button } from '../components/ui';

export default function TreatCheckoutScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { customer, user } = useAuth();
  const [room, setRoom] = useState<TreatRoom | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToTreatRoom(roomId, setRoom);
    return () => unsub();
  }, [roomId]);

  const handlePay = async () => {
    if (!room || !customer || !user) return;
    setLoading(true);

    try {
      const orderItems = room.cart.map(item => ({
        id: item.itemId,
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isVeg: item.isVeg,
        addedBy: item.addedBy.name,
      }));

      const participants = room.invitedFriends.filter(f => f.status === 'joined').map(f => f.name);

      // Payment FIRST, then create order
      const paymentResponse = await RazorpayService.openPayment({
        amount: RazorpayService.toPaisa(room.totalAmount),
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '9999999999',
        description: `Treat at ${room.restaurantName}`,
      });

      // Only create order after successful payment
      const orderResult = await createOrder({
        customerId: user.uid,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        restaurantId: room.restaurantId,
        restaurantName: room.restaurantName,
        items: orderItems,
        totalAmount: room.totalAmount,
        isTreat: true,
        treatHostName: room.hostName,
        treatParticipants: participants,
      });

      if (!orderResult.success || !orderResult.id) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      await updateOrderPayment(orderResult.id, paymentResponse.razorpay_payment_id);
      await markTreatOrdered(roomId!, orderResult.id);

      router.replace(`/order/${orderResult.id}` as any);
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Something went wrong');
    }

    setLoading(false);
  };

  if (!room) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 100 }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const participants = room.invitedFriends.filter(f => f.status === 'joined');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.warning }]}>
        <Ionicons name="gift" size={32} color="#fff" />
        <Text style={styles.headerTitle}>Treat Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>You're treating</Text>
          <View style={styles.participantsList}>
            {participants.map(p => (
              <View key={p.id} style={[styles.participantChip, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.participantName, { color: colors.primary }]}>{p.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          {room.cart.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.quantity}x {item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.gray100 }]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>₹{room.totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.gray100 }]}>
        <Button 
          title={`Pay ₹${room.totalAmount}`}
          onPress={handlePay}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.xl, alignItems: 'center' },
  headerTitle: { ...textStyles.h2, color: '#fff', marginTop: spacing.sm },
  content: { padding: spacing.md },
  card: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  cardTitle: { ...textStyles.label, marginBottom: spacing.sm },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  participantChip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  participantName: { ...textStyles.caption },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemName: { ...textStyles.body },
  itemPrice: { ...textStyles.body },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1 },
  totalLabel: { ...textStyles.h3 },
  totalValue: { ...textStyles.h2 },
  footer: { padding: spacing.md, borderTopWidth: 1 },
});
