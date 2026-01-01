import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { Button } from '../components/ui';
import { useEffect } from 'react';

export default function PaymentFailedScreen() {
  const colors = useColors();
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="close-circle" size={80} color={colors.error} />
        </View>
        
        <Text style={[styles.title, { color: colors.textPrimary }]}>Payment Failed</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {reason || 'Your payment could not be processed. Please try again.'}
        </Text>

        <View style={[styles.infoBox, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Don't worry, no money was deducted from your account.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Try Again" 
          onPress={() => router.back()} 
          fullWidth 
        />
        <Button 
          title="Go to Home" 
          variant="outline"
          onPress={() => router.replace('/(tabs)')} 
          fullWidth 
          style={{ marginTop: spacing.md }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: { ...textStyles.h1, marginBottom: spacing.md },
  message: {
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  infoText: { ...textStyles.bodySmall, flex: 1 },
  footer: { padding: spacing.xl },
});
