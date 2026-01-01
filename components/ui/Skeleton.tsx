import React from 'react';
import { ViewStyle, DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { borderRadius } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius: radius = borderRadius.md,
  style 
}: SkeletonProps) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.gray200 },
        { width, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}
