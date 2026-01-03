import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
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
  const colors = useColors();
  const { customer, refreshCustomer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const friends = customer?.friends || [];
  const owes = customer?.owes || {};
  const friendIds = friends.map(f => f.odid).join(','); // Stable reference for useEffect

  // Search users by username
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const result = await searchUsersByUsername(searchQuery);
      if (result.success && result.data) {
        // Filter out self and existing friends
        const filtered = (result.data as UserResult[]).filter(
          (u) => u.id !== customer?.id && !friends.some(f => f.odid === u.id)
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
      const friendData = { odid: user.id, odname: user.name, username: user.username };
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Friends</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Money Owed Banner */}
      {totalOwed > 0 && (
        <TouchableOpacity style={[styles.owedBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]} onPress={() => router.push('/money-owed')}>
          <View style={styles.owedLeft}>
            <Ionicons name="wallet-outline" size={24} color={colors.warning} />
            <View style={styles.owedInfo}>
              <Text style={[styles.owedTitle, { color: colors.textSecondary }]}>You owe</Text>
              <Text style={[styles.owedAmount, { color: colors.warning }]}>₹{totalOwed}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
          <Ionicons name="search" size={20} color={colors.gray500} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
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
          <View style={[styles.dropdown, { backgroundColor: colors.white, borderColor: colors.gray200 }]}>
            {searchResults.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[styles.dropdownItem, { borderBottomColor: colors.gray100 }]}
                onPress={() => handleAddFriend(user)}
              >
                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.white }]}>{user.name.charAt(0)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                  <Text style={[styles.userUsername, { color: colors.textSecondary }]}>@{user.username}</Text>
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
        keyExtractor={(item) => item.odid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No friends added yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>Search by username to add friends</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.friendCard, { backgroundColor: colors.white }]}>
            <View style={[styles.friendAvatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.friendAvatarText, { color: colors.white }]}>{item.odname.charAt(0)}</Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={[styles.friendName, { color: colors.textPrimary }]}>{item.odname}</Text>
              <Text style={[styles.friendUsername, { color: colors.textSecondary }]}>@{item.username}</Text>
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
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  owedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: spacing.lg, padding: spacing.lg,
    borderRadius: borderRadius.lg, borderWidth: 1,
  },
  owedLeft: { flexDirection: 'row', alignItems: 'center' },
  owedInfo: { marginLeft: spacing.md },
  owedTitle: { ...textStyles.caption },
  owedAmount: { ...textStyles.h3 },
  searchContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg, borderWidth: 1,
  },
  searchInput: { flex: 1, ...textStyles.body, marginLeft: spacing.sm, paddingVertical: spacing.xs },
  dropdown: {
    position: 'absolute', top: 52, left: spacing.lg, right: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1, ...({ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }),
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...textStyles.label },
  userInfo: { flex: 1, marginLeft: spacing.md },
  userName: { ...textStyles.label },
  userUsername: { ...textStyles.caption },
  list: { padding: spacing.lg, paddingTop: 0 },
  friendCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm,
  },
  friendAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  friendAvatarText: { ...textStyles.h4 },
  friendInfo: { flex: 1, marginLeft: spacing.md },
  friendName: { ...textStyles.label },
  friendUsername: { ...textStyles.caption },
  removeBtn: { padding: spacing.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h4, marginTop: spacing.md },
  emptySubtext: { ...textStyles.body, marginTop: spacing.xs },
});
