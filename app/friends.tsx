import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { addFriend, removeFriend, Friend } from '../services/friends';
import { Button } from '../components/ui';

export default function FriendsScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const friends: Friend[] = customer?.friends || [];

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!customer?.id) return;

    setLoading(true);
    const result = await addFriend(customer.id, { name: name.trim(), phone: phone.trim() || undefined });
    setLoading(false);

    if (result.success) {
      setName('');
      setPhone('');
      setShowAdd(false);
      refreshCustomer?.();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert('Remove Friend', `Remove ${friend.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!customer?.id) return;
          const result = await removeFriend(customer.id, friend);
          if (result.success) {
            refreshCustomer?.();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={styles.backBtn}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Friend's name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textTertiary}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={colors.textTertiary}
          />
          <Button title="Add Friend" onPress={handleAdd} loading={loading} fullWidth />
        </View>
      )}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No friends added yet</Text>
            <Text style={styles.emptySubtext}>Add friends to split bills when ordering</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              {item.phone && <Text style={styles.friendPhone}>{item.phone}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  addForm: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...textStyles.body,
    color: colors.textPrimary,
  },
  list: { padding: spacing.lg },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...textStyles.h4, color: colors.white },
  friendInfo: { flex: 1, marginLeft: spacing.md },
  friendName: { ...textStyles.label, color: colors.textPrimary },
  friendPhone: { ...textStyles.caption, color: colors.textSecondary },
  removeBtn: { padding: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h4, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...textStyles.body, color: colors.textTertiary, marginTop: spacing.xs },
});
