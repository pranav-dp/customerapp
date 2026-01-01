import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { textStyles } from '../../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const getButtonStyle = () => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.gray100 },
      outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
      ghost: { backgroundColor: 'transparent' },
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingVertical: 10, paddingHorizontal: 16 },
      medium: { paddingVertical: 14, paddingHorizontal: 24 },
      large: { paddingVertical: 18, paddingHorizontal: 32 },
    };

    const disabledStyle: ViewStyle = disabled 
      ? { backgroundColor: colors.gray200, borderColor: colors.gray200 } 
      : {};

    return [
      baseStyle,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && { width: '100%' as const },
      disabledStyle,
      style,
    ];
  };

  const getTextStyle = () => {
    const variantTextColors: Record<string, string> = {
      primary: colors.black,
      secondary: colors.textPrimary,
      outline: colors.primary,
      ghost: colors.primary,
    };

    const sizeTextStyles: Record<string, TextStyle> = {
      small: textStyles.buttonSmall,
      medium: textStyles.button,
      large: { ...textStyles.button, fontSize: 18 },
    };

    return [
      textStyles.button,
      { color: disabled ? colors.textDisabled : variantTextColors[variant] },
      sizeTextStyles[size],
      textStyle,
    ];
  };

  return (
    <AnimatedTouchable
      style={[getButtonStyle(), animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.black : colors.primary} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </AnimatedTouchable>
  );
}
