import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useColors } from '../../hooks/useColors';
import { useAuth } from '../../contexts/AuthContext';
import { createTreatRoom, inviteFriend } from '../../services/treatMode';
import { Button } from '../../components/ui';

export default function CreateTreatScreen() {
  const { restaurantId, restaurantName } = useLocalSearchParams<{ restaurantId: string; restaurantName: string }>();
  const router = useRouter();
  const colors = useColors();
  const { customer } = useAuth();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const friends = customer?.friends || [];

  const toggleFriend = (odid: string) => {
    setSelectedFriends(prev => 
      prev.includes(odid) ? prev.filter(id => id !== odid) : [...prev, odid]
    );
  };

  const handleCreate = async () => {
    if (!customer?.id || !restaurantId || !restaurantName) return;
    if (selectedFriends.length === 0) {
      Alert.alert('Select Friends', 'Please select at least one friend to treat');
      return;
    }

    setLoading(true);
    const result = await createTreatRoom(customer.id, customer.name, restaurantId, restaurantName);
    
    if (result.success && result.id) {
      // Invite selected friends
      for (const odid of selectedFriends) {
        const friend = friends.find((f: any) => f.odid === odid);
        if (friend) {
          await inviteFriend(result.id, { id: friend.odid, name: friend.odname, username: friend.username });
        }
      }
      router.replace(`/treat-room/${result.id}` as any);
    } else {
      Alert.alert('Error', result.error || 'Failed to create treat room');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Start a Treat</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.restaurantCard, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <Ionicons name="restaurant" size={24} color={colors.warning} />
          <Text style={[styles.restaurantName, { color: colors.textPrimary }]}>{restaurantName}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Who are you treating?</Text>
        
        {friends.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.white }]}>
            <Ionicons name="people-outline" size={48} color={colors.gray300} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No friends added yet</Text>
            <TouchableOpacity onPress={() => router.push('/friends')}>
              <Text style={[styles.addFriendsLink, { color: colors.primary }]}>Add friends first</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.friendsList, { backgroundColor: colors.white }]}>
            {friends.map((friend: any) => (
              <TouchableOpacity
                key={friend.odid}
                style={[styles.friendItem, { borderBottomColor: colors.gray100 }]}
                onPress={() => toggleFriend(friend.odid)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{friend.odname.charAt(0)}</Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: colors.textPrimary }]}>{friend.odname}</Text>
                  <Text style={[styles.friendUsername, { color: colors.textTertiary }]}>@{friend.username}</Text>
                </View>
                <View style={[
                  styles.checkbox, 
                  { borderColor: selectedFriends.includes(friend.odid) ? colors.warning : colors.gray300,
                    backgroundColor: selectedFriends.includes(friend.odid) ? colors.warning : 'transparent' }
                ]}>
                  {selectedFriends.includes(friend.odid) && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.gray100 }]}>
        <Button 
          title={`Treat ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''}`}
          onPress={handleCreate}
          loading={loading}
          disabled={selectedFriends.length === 0}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1 },
  headerTitle: { ...textStyles.h3 },
  content: { padding: spacing.md },
  restaurantCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.lg },
  restaurantName: { ...textStyles.h3 },
  sectionTitle: { ...textStyles.label, marginBottom: spacing.sm },
  emptyState: { padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyText: { ...textStyles.body, marginTop: spacing.sm },
  addFriendsLink: { ...textStyles.label, marginTop: spacing.sm },
  friendsList: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...textStyles.label, color: '#fff' },
  friendInfo: { flex: 1, marginLeft: spacing.sm },
  friendName: { ...textStyles.body },
  friendUsername: { ...textStyles.caption },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: spacing.md, borderTopWidth: 1 },
});
