import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { Button, Input, Header } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: Password & College info
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [hostel, setHostel] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSignup = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await signup(email, password, {
        name: name.trim(),
        email,
        phone,
        rollNumber: rollNumber.trim() || undefined,
        hostel: hostel.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header 
        showBack 
        onBackPress={() => step === 1 ? router.back() : setStep(1)} 
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoSmall}>
              <Ionicons name="restaurant" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              {step === 1 ? 'Personal details' : 'Almost there!'}
            </Text>
          </View>

          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Let us know how to properly address you. Please fill in your details.'
              : 'Create a password and add your college info (optional).'}
          </Text>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 1 ? (
              <>
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon="person-outline"
                  error={errors.name}
                />
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  error={errors.email}
                />
                <Input
                  label="Phone Number"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  leftIcon="call-outline"
                  error={errors.phone}
                />
              </>
            ) : (
              <>
                <Input
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  error={errors.password}
                />
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                  error={errors.confirmPassword}
                />
                <View style={styles.optionalSection}>
                  <Text style={styles.optionalLabel}>College Info (Optional)</Text>
                  <Input
                    label="Roll Number"
                    placeholder="e.g., 2021CSE001"
                    value={rollNumber}
                    onChangeText={setRollNumber}
                    autoCapitalize="characters"
                    leftIcon="school-outline"
                  />
                  <Input
                    label="Hostel"
                    placeholder="e.g., Boys Hostel 5"
                    value={hostel}
                    onChangeText={setHostel}
                    leftIcon="home-outline"
                  />
                </View>
              </>
            )}
          </View>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomSection}>
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{step}/2</Text>
          </View>
          <Button
            title={step === 1 ? 'Continue' : 'Create Account'}
            onPress={step === 1 ? handleNext : handleSignup}
            loading={loading}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  logoSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
    flex: 1,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gray300,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.gray300,
    marginHorizontal: spacing.sm,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  form: {
    marginBottom: spacing.lg,
  },
  optionalSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  optionalLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...textStyles.label,
    color: colors.primary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  stepCounter: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepCounterText: {
    ...textStyles.labelSmall,
    color: colors.textTertiary,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
