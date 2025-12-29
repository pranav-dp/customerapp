import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { searchUsersByUsername } from '../services/firestore';

interface UserResult {
  id: string;
  name: string;
  username: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const { customer, refreshCustomer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const friends = customer?.friends || [];
  const owes = customer?.owes || {};
  const friendIds = friends.map(f => f.id).join(','); // Stable reference for useEffect

  // Search users by username
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const result = await searchUsersByUsername(searchQuery);
      if (result.success) {
        // Filter out self and existing friends
        const filtered = result.data.filter(
          (u: UserResult) => u.id !== customer?.id && !friends.some(f => f.id === u.id)
        );
        setSearchResults(filtered);
      }
      setSearching(false);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, customer?.id, friendIds]);

  const handleAddFriend = async (user: UserResult) => {
    if (!customer?.id) return;
    try {
      const friendData = { id: user.id, name: user.name, username: user.username };
      await updateDoc(doc(db, 'customers', customer.id), {
        friends: arrayUnion(friendData),
      });
      setSearchQuery('');
      setSearchResults([]);
      await refreshCustomer?.();
      Alert.alert('Added!', `${user.name} is now your friend`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRemoveFriend = (friend: any) => {
    Alert.alert('Remove Friend', `Remove ${friend.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          if (!customer?.id) return;
          await updateDoc(doc(db, 'customers', customer.id), {
            friends: arrayRemove(friend),
          });
          refreshCustomer?.();
        },
      },
    ]);
  };

  const totalOwed = Object.values(owes).reduce((sum, amt) => sum + amt, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Money Owed Banner */}
      {totalOwed > 0 && (
        <TouchableOpacity style={styles.owedBanner} onPress={() => router.push('/money-owed')}>
          <View style={styles.owedLeft}>
            <Ionicons name="wallet-outline" size={24} color={colors.warning} />
            <View style={styles.owedInfo}>
              <Text style={styles.owedTitle}>You owe</Text>
              <Text style={styles.owedAmount}>₹{totalOwed}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.dropdown}>
            {searchResults.map(user => (
              <TouchableOpacity
                key={user.id}
                style={styles.dropdownItem}
                onPress={() => handleAddFriend(user)}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userUsername}>@{user.username}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={colors.success} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Friends List */}
      <FlatList
        data={friends}
        style={{ zIndex: 1 }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No friends added yet</Text>
            <Text style={styles.emptySubtext}>Search by username to add friends</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.name}</Text>
              <Text style={styles.friendUsername}>@{item.username}</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveFriend(item)} style={styles.removeBtn}>
              <Ionicons name="close-circle" size={24} color={colors.gray400} />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  owedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.warning + '15', margin: spacing.lg, padding: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.warning + '30',
  },
  owedLeft: { flexDirection: 'row', alignItems: 'center' },
  owedInfo: { marginLeft: spacing.md },
  owedTitle: { ...textStyles.caption, color: colors.textSecondary },
  owedAmount: { ...textStyles.h3, color: colors.warning },
  searchContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.gray200,
  },
  searchInput: { flex: 1, ...textStyles.body, color: colors.textPrimary, marginLeft: spacing.sm, paddingVertical: spacing.xs },
  dropdown: {
    position: 'absolute', top: 52, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.white, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.gray200, ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }),
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...textStyles.label, color: colors.white },
  userInfo: { flex: 1, marginLeft: spacing.md },
  userName: { ...textStyles.label, color: colors.textPrimary },
  userUsername: { ...textStyles.caption, color: colors.textSecondary },
  list: { padding: spacing.lg, paddingTop: 0 },
  friendCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
  },
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarText: { ...textStyles.h4, color: colors.white },
  friendInfo: { flex: 1, marginLeft: spacing.md },
  friendName: { ...textStyles.label, color: colors.textPrimary },
  friendUsername: { ...textStyles.caption, color: colors.textSecondary },
  removeBtn: { padding: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h4, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...textStyles.body, color: colors.textTertiary, marginTop: spacing.xs },
});
