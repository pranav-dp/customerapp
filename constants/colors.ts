// Light theme colors
export const lightColors = {
  // Primary - Warm yellow/orange like McDonald's
  primary: '#FFBC0D',
  primaryDark: '#E5A800',
  primaryLight: '#FFF4D6',

  // Accent - Red for CTAs
  accent: '#E31837',
  accentLight: '#FFE8EB',

  // Success/Status
  success: '#27AE60',
  successLight: '#E8F8EF',
  warning: '#F39C12',
  warningLight: '#FEF5E7',
  error: '#E74C3C',
  errorLight: '#FDEDEC',
  info: '#3498DB',
  infoLight: '#EBF5FB',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F8F8F8',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Veg/Non-veg indicators
  veg: '#27AE60',
  nonVeg: '#E31837',
  egg: '#F39C12',

  // Card/Container
  card: '#FFFFFF',
  border: '#EEEEEE',
};

// Dark theme colors
export const darkColors = {
  // Primary - Keep brand colors consistent
  primary: '#FFBC0D',
  primaryDark: '#E5A800',
  primaryLight: '#3D3200',

  // Accent - Red for CTAs
  accent: '#E31837',
  accentLight: '#3D1520',

  // Success/Status
  success: '#27AE60',
  successLight: '#1A3D2A',
  warning: '#F39C12',
  warningLight: '#3D2E10',
  error: '#E74C3C',
  errorLight: '#3D1A18',
  info: '#3498DB',
  infoLight: '#1A2D3D',

  // Neutrals (inverted)
  white: '#1A1A1A',
  black: '#FFFFFF',
  gray50: '#1E1E1E',
  gray100: '#252525',
  gray200: '#2D2D2D',
  gray300: '#3D3D3D',
  gray400: '#5C5C5C',
  gray500: '#7A7A7A',
  gray600: '#9E9E9E',
  gray700: '#BDBDBD',
  gray800: '#E0E0E0',
  gray900: '#F5F5F5',

  // Text (inverted)
  textPrimary: '#F5F5F5',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textDisabled: '#505050',

  // Background
  background: '#121212',
  backgroundSecondary: '#1A1A1A',
  surface: '#1E1E1E',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Veg/Non-veg indicators (keep same for recognition)
  veg: '#27AE60',
  nonVeg: '#E31837',
  egg: '#F39C12',

  // Card/Container
  card: '#1E1E1E',
  border: '#2D2D2D',
};

// Default export for backward compatibility (light theme)
export const colors = lightColors;

// Function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? darkColors : lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
