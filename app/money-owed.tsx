import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { getCustomer } from '../services/firestore';
import { getMoneyOwedToMe } from '../services/friends';

interface OwedItem {
  id: string;
  name: string;
  username: string;
  amount: number;
}

export default function MoneyOwedScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { customer } = useAuth();
  const [activeTab, setActiveTab] = useState<'iOwe' | 'owedToMe'>(tab === 'toMe' ? 'owedToMe' : 'iOwe');
  const [iOweList, setIOweList] = useState<OwedItem[]>([]);
  const [owedToMeList, setOwedToMeList] = useState<OwedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!customer?.id) return;
      
      // Fetch what I owe
      const iOweItems: OwedItem[] = [];
      for (const [id, amount] of Object.entries(customer.owes || {})) {
        if (amount > 0) {
          const result = await getCustomer(id);
          if (result.success && result.data) {
            const data = result.data as { id: string; name: string; username?: string };
            iOweItems.push({ id, name: data.name || 'Unknown', username: data.username || '', amount });
          }
        }
      }
      setIOweList(iOweItems);
      
      // Fetch what's owed to me
      const result = await getMoneyOwedToMe(customer.id);
      if (result.success) {
        setOwedToMeList(result.details.map(d => ({ id: d.friendId, name: d.friendName, username: '', amount: d.amount })));
      }
      setLoading(false);
    };
    fetchData();
  }, [customer?.id, customer?.owes]);

  const list = activeTab === 'iOwe' ? iOweList : owedToMeList;
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  const isOwedToMe = activeTab === 'owedToMe';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.white }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Money</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.white, borderBottomColor: colors.gray100 }]}>
        <TouchableOpacity 
          style={[styles.tab, { borderBottomColor: activeTab === 'iOwe' ? colors.primary : 'transparent' }]} 
          onPress={() => setActiveTab('iOwe')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'iOwe' ? colors.primary : colors.textSecondary }]}>I Owe</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, { borderBottomColor: activeTab === 'owedToMe' ? colors.primary : 'transparent' }]} 
          onPress={() => setActiveTab('owedToMe')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'owedToMe' ? colors.primary : colors.textSecondary }]}>Owed to Me</Text>
        </TouchableOpacity>
      </View>

      {/* Total Banner */}
      <View style={[styles.totalBanner, { backgroundColor: isOwedToMe ? colors.success : colors.warning }]}>
        <Text style={[styles.totalLabel, { color: colors.white }]}>{isOwedToMe ? 'Friends owe you' : 'You owe'}</Text>
        <Text style={[styles.totalAmount, { color: colors.white }]}>₹{total}</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>{isOwedToMe ? 'No one owes you' : "You're all settled!"}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.owedCard, { backgroundColor: colors.white }]}>
            <View style={[styles.owedAvatar, { backgroundColor: isOwedToMe ? colors.success : colors.warning }]}>
              <Text style={[styles.avatarText, { color: colors.white }]}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.owedInfo}>
              <Text style={[styles.owedName, { color: colors.textPrimary }]}>{item.name}</Text>
              {item.username && <Text style={[styles.owedUsername, { color: colors.textSecondary }]}>@{item.username}</Text>}
            </View>
            <View style={styles.owedAmountContainer}>
              <Text style={[styles.owedAmountLabel, { color: colors.textSecondary }]}>{isOwedToMe ? 'Owes you' : 'You owe'}</Text>
              <Text style={[styles.owedAmount, { color: isOwedToMe ? colors.success : colors.warning }]}>₹{item.amount}</Text>
            </View>
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
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3 },
  tabs: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { ...textStyles.label },
  totalBanner: { padding: spacing.xl, alignItems: 'center' },
  totalLabel: { ...textStyles.body, opacity: 0.9 },
  totalAmount: { ...textStyles.h1, marginTop: spacing.xs },
  list: { padding: spacing.lg },
  owedCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md,
  },
  owedAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...textStyles.h4 },
  owedInfo: { flex: 1, marginLeft: spacing.md },
  owedName: { ...textStyles.label },
  owedUsername: { ...textStyles.caption },
  owedAmountContainer: { alignItems: 'flex-end' },
  owedAmountLabel: { ...textStyles.caption },
  owedAmount: { ...textStyles.h3 },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h3, marginTop: spacing.lg },
});
