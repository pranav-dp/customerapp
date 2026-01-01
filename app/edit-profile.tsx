import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Button } from '../components/ui';

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { customer, refreshCustomer } = useAuth();
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [hostel, setHostel] = useState(customer?.hostel || '');
  const [room, setRoom] = useState(customer?.room || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!customer?.id) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        name: name.trim(),
        phone: phone.trim(),
        hostel: hostel.trim(),
        room: room.trim(),
        updatedAt: new Date(),
      });
      await refreshCustomer?.();
      Alert.alert('Success', 'Profile updated', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Edit Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
          <TextInput style={[styles.input, { borderColor: colors.gray200, color: colors.textPrimary, backgroundColor: colors.white }]} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textTertiary} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
          <TextInput style={[styles.input, { borderColor: colors.gray200, color: colors.textPrimary, backgroundColor: colors.white }]} value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={colors.textTertiary} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Hostel</Text>
          <TextInput style={[styles.input, { borderColor: colors.gray200, color: colors.textPrimary, backgroundColor: colors.white }]} value={hostel} onChangeText={setHostel} placeholder="Your hostel" placeholderTextColor={colors.textTertiary} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Room</Text>
          <TextInput style={[styles.input, { borderColor: colors.gray200, color: colors.textPrimary, backgroundColor: colors.white }]} value={room} onChangeText={setRoom} placeholder="Room number" placeholderTextColor={colors.textTertiary} />
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.info + '15' }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={[styles.infoText, { color: colors.info }]}>Email and Roll Number cannot be changed</Text>
        </View>

        <Button title="Save Changes" onPress={handleSave} loading={loading} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  content: { padding: spacing.lg },
  field: { marginBottom: spacing.lg },
  label: { ...textStyles.label, marginBottom: spacing.xs },
  input: {
    borderWidth: 1, borderRadius: borderRadius.md,
    padding: spacing.md, ...textStyles.body,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xl,
  },
  infoText: { ...textStyles.caption, flex: 1 },
});
