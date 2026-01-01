import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { lightColors, darkColors } from '../constants/colors';

export function useColors() {
  const { isDark } = useTheme();
  
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);
  
  return colors;
}
