import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../constants/colors';
import { useColors } from '../hooks/useColors';
import { textStyles } from '../constants/typography';
import { Button } from '../components/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="restaurant" size={56} color={colors.primary} />
            </View>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Good things ahead</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Order food from your campus restaurants, skip the queue, and track your order in real-time.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={28} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Skip the queue</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="phone-portrait" size={28} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Order from class</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications" size={28} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Get notified</Text>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.bottomSection}>
        <Button
          title="Log in"
          variant="outline"
          onPress={() => router.push('/login')}
          fullWidth
          style={{ ...styles.loginButton, backgroundColor: colors.white }}
        />
        <Button
          title="Sign up"
          variant="primary"
          onPress={() => router.push('/signup')}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...textStyles.displayLarge,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...textStyles.bodyLarge,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xxl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    ...textStyles.labelSmall,
  },
  bottomSection: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  loginButton: {},
});
