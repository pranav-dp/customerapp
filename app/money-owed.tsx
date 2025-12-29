import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../constants/colors';
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Money</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'iOwe' && styles.tabActive]} 
          onPress={() => setActiveTab('iOwe')}
        >
          <Text style={[styles.tabText, activeTab === 'iOwe' && styles.tabTextActive]}>I Owe</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'owedToMe' && styles.tabActive]} 
          onPress={() => setActiveTab('owedToMe')}
        >
          <Text style={[styles.tabText, activeTab === 'owedToMe' && styles.tabTextActive]}>Owed to Me</Text>
        </TouchableOpacity>
      </View>

      {/* Total Banner */}
      <View style={[styles.totalBanner, isOwedToMe && styles.totalBannerGreen]}>
        <Text style={styles.totalLabel}>{isOwedToMe ? 'Friends owe you' : 'You owe'}</Text>
        <Text style={styles.totalAmount}>₹{total}</Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
              <Text style={styles.emptyText}>{isOwedToMe ? 'No one owes you' : "You're all settled!"}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.owedCard}>
            <View style={[styles.owedAvatar, isOwedToMe && styles.avatarGreen]}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.owedInfo}>
              <Text style={styles.owedName}>{item.name}</Text>
              {item.username && <Text style={styles.owedUsername}>@{item.username}</Text>}
            </View>
            <View style={styles.owedAmountContainer}>
              <Text style={styles.owedAmountLabel}>{isOwedToMe ? 'Owes you' : 'You owe'}</Text>
              <Text style={[styles.owedAmount, isOwedToMe && styles.amountGreen]}>₹{item.amount}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.white, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.gray100,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...textStyles.label, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  totalBanner: { backgroundColor: colors.warning, padding: spacing.xl, alignItems: 'center' },
  totalBannerGreen: { backgroundColor: colors.success },
  totalLabel: { ...textStyles.body, color: colors.white, opacity: 0.9 },
  totalAmount: { ...textStyles.h1, color: colors.white, marginTop: spacing.xs },
  list: { padding: spacing.lg },
  owedCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: spacing.lg, borderRadius: borderRadius.lg, marginBottom: spacing.md,
  },
  owedAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center' },
  avatarGreen: { backgroundColor: colors.success },
  avatarText: { ...textStyles.h4, color: colors.white },
  owedInfo: { flex: 1, marginLeft: spacing.md },
  owedName: { ...textStyles.label, color: colors.textPrimary },
  owedUsername: { ...textStyles.caption, color: colors.textSecondary },
  owedAmountContainer: { alignItems: 'flex-end' },
  owedAmountLabel: { ...textStyles.caption, color: colors.textSecondary },
  owedAmount: { ...textStyles.h3, color: colors.warning },
  amountGreen: { color: colors.success },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.h3, color: colors.textPrimary, marginTop: spacing.lg },
});
