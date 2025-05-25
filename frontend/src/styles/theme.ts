import { colors } from './colors';

// Light theme configuration
export const lightTheme = {
  colors: {
    // Background colors
    background: {
      primary: colors.white,
      secondary: colors.gray[50],
      tertiary: colors.gray[100],
      elevated: colors.white,
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text colors
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[700],
      tertiary: colors.gray[500],
      disabled: colors.gray[400],
      inverse: colors.white,
    },

    // Border colors
    border: {
      primary: colors.gray[200],
      secondary: colors.gray[300],
      focus: colors.primary[500],
      error: colors.error[500],
      success: colors.success[500],
    },

    // Brand colors
    brand: {
      primary: colors.primary[500],
      primaryHover: colors.primary[600],
      primaryActive: colors.primary[700],
      secondary: colors.secondary[500],
      secondaryHover: colors.secondary[600],
      accent: colors.accent[500],
      accentHover: colors.accent[600],
    },

    // State colors
    state: {
      success: colors.success[500],
      successBg: colors.success[50],
      successBorder: colors.success[200],
      warning: colors.warning[500],
      warningBg: colors.warning[50],
      warningBorder: colors.warning[200],
      error: colors.error[500],
      errorBg: colors.error[50],
      errorBorder: colors.error[200],
      info: colors.primary[500],
      infoBg: colors.primary[50],
      infoBorder: colors.primary[200],
    },

    // Interactive colors
    interactive: {
      hover: colors.gray[100],
      active: colors.gray[200],
      disabled: colors.gray[100],
      selected: colors.primary[100],
    },
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    none: 'none',
  },
} as const;

// Dark theme configuration
export const darkTheme = {
  colors: {
    // Background colors
    background: {
      primary: colors.gray[900],
      secondary: colors.gray[800],
      tertiary: colors.gray[700],
      elevated: colors.gray[800],
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    // Text colors
    text: {
      primary: colors.gray[100],
      secondary: colors.gray[300],
      tertiary: colors.gray[400],
      disabled: colors.gray[500],
      inverse: colors.gray[900],
    },

    // Border colors
    border: {
      primary: colors.gray[700],
      secondary: colors.gray[600],
      focus: colors.primary[400],
      error: colors.error[400],
      success: colors.success[400],
    },

    // Brand colors
    brand: {
      primary: colors.primary[400],
      primaryHover: colors.primary[300],
      primaryActive: colors.primary[500],
      secondary: colors.secondary[400],
      secondaryHover: colors.secondary[300],
      accent: colors.accent[400],
      accentHover: colors.accent[300],
    },

    // State colors
    state: {
      success: colors.success[400],
      successBg: colors.success[950],
      successBorder: colors.success[800],
      warning: colors.warning[400],
      warningBg: colors.warning[950],
      warningBorder: colors.warning[800],
      error: colors.error[400],
      errorBg: colors.error[950],
      errorBorder: colors.error[800],
      info: colors.primary[400],
      infoBg: colors.primary[950],
      infoBorder: colors.primary[800],
    },

    // Interactive colors
    interactive: {
      hover: colors.gray[800],
      active: colors.gray[700],
      disabled: colors.gray[800],
      selected: colors.primary[900],
    },
  },

  // Shadows (darker for dark theme)
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    none: 'none',
  },
} as const;

export type Theme = typeof lightTheme;
export type ThemeColors = Theme['colors'];
export type ThemeShadows = Theme['shadows'];
