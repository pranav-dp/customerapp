import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, spacing } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPasswordToggle = secureTextEntry !== undefined;
  const actualSecureEntry = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.gray50, borderColor: colors.gray200 },
          isFocused && { borderColor: colors.primary, backgroundColor: colors.white },
          error && { borderColor: colors.error },
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={20} color={colors.gray500} style={styles.leftIcon} />
        )}
        <RNTextInput
          style={[styles.input, { color: colors.textPrimary }, leftIcon && styles.inputWithLeftIcon, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={actualSecureEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.rightIcon}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.gray500}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon} disabled={!onRightIconPress}>
            <Ionicons name={rightIcon} size={20} color={colors.gray500} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.label,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    ...textStyles.bodyLarge,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  leftIcon: {
    marginLeft: spacing.lg,
  },
  rightIcon: {
    padding: spacing.lg,
  },
  error: {
    ...textStyles.caption,
    marginTop: spacing.xs,
  },
});
