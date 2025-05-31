import { colors } from './colors';
import { breakpoints } from './tokens';

// Define theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// CSS variable mapping helper
function createCssVarNames(prefix: string, obj: Record<string, unknown>, path: string[] = []): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const newPath = [...path, key];
    const value = obj[key];

    if (typeof value === 'object' && value !== null) {
      const nestedVars = createCssVarNames(prefix, value as Record<string, unknown>, newPath);
      Object.assign(result, nestedVars);
    } else {
      const varName = `--${prefix}-${newPath.join('-')}`;
      result[newPath.join('.')] = varName;
    }
  }

  return result;
}

// Light theme configuration
export const lightTheme = {
  colors: {
    // Background colors
    background: {
      primary: colors.neutral[50],
      secondary: colors.neutral[0],
      tertiary: colors.neutral[100],
      elevated: colors.neutral[0],
      overlay: 'rgba(0, 0, 0, 0.4)',
    },

    // Text colors
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      disabled: colors.neutral[400],
      inverse: colors.neutral[0],
      link: colors.primary[600],
      'link-hover': colors.primary[700],
    },

    // Border colors
    border: {
      primary: colors.neutral[200],
      secondary: colors.neutral[300],
      tertiary: colors.neutral[400],
      focus: colors.primary[500],
    },

    // Brand colors
    brand: {
      primary: colors.primary[500],
      'primary-hover': colors.primary[600],
      'primary-active': colors.primary[700],
      secondary: colors.secondary[500],
      'secondary-hover': colors.secondary[600],
      accent: colors.accent[500],
      'accent-hover': colors.accent[600],
    },

    // State colors
    state: {
      success: colors.success[600],
      'success-bg': colors.success[50],
      'success-border': colors.success[200],
      warning: colors.warning[500],
      'warning-bg': colors.warning[50],
      'warning-border': colors.warning[200],
      error: colors.error[600],
      'error-bg': colors.error[50],
      'error-border': colors.error[200],
      info: colors.info[600],
      'info-bg': colors.info[50],
      'info-border': colors.info[200],
    },

    // Interactive colors
    interactive: {
      hover: colors.neutral[100],
      active: colors.neutral[200],
      disabled: colors.neutral[100],
      selected: colors.primary[100],
      focus: 'rgba(59, 130, 246, 0.3)',
    },
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.06)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.06)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    none: 'none',
  },

  // Blur effects
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '48px',
  },

  // Responsive values for different screen sizes
  responsive: {
    spacing: {
      container: {
        xs: '1rem',
        sm: '2rem',
        md: '3rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      gutter: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      }
    }
  }
} as const;

// Dark theme configuration
export const darkTheme = {
  colors: {
    // Background colors
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      elevated: 'rgba(17, 24, 39, 0.95)',
      overlay: 'rgba(0, 0, 0, 0.75)',
    },

    // Text colors
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#64748b',
      inverse: '#0f172a',
      link: '#93c5fd',
      'link-hover': '#bfdbfe',
    },

    // Border colors
    border: {
      primary: '#334155',
      secondary: '#1e293b',
      tertiary: '#475569',
      focus: '#3b82f6',
    },

    // Brand colors
    brand: {
      primary: '#3b82f6',
      'primary-hover': '#60a5fa',
      'primary-active': '#2563eb',
      secondary: '#8b5cf6',
      'secondary-hover': '#a78bfa',
      accent: '#f59e0b',
      'accent-hover': '#fbbf24',
    },

    // State colors
    state: {
      success: '#34d399',
      'success-bg': 'rgba(6, 78, 59, 0.2)',
      'success-border': '#065f46',
      warning: '#fbbf24',
      'warning-bg': 'rgba(120, 53, 15, 0.2)',
      'warning-border': '#92400e',
      error: '#f87171',
      'error-bg': 'rgba(127, 29, 29, 0.2)',
      'error-border': '#991b1b',
      info: '#60a5fa',
      'info-bg': 'rgba(30, 58, 138, 0.2)',
      'info-border': '#1e40af',
    },

    // Interactive colors
    interactive: {
      hover: 'rgba(255, 255, 255, 0.05)',
      active: 'rgba(255, 255, 255, 0.1)',
      disabled: 'rgba(30, 41, 59, 0.5)',
      selected: 'rgba(59, 130, 246, 0.2)',
      focus: 'rgba(96, 165, 250, 0.25)',
    },
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
    md: '0 3px 5px -1px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
    lg: '0 5px 10px -3px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
    xl: '0 10px 15px -5px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)',
    '2xl': '0 15px 25px -12px rgba(0, 0, 0, 0.4)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    none: 'none',
    highlight: '0 0 10px rgba(59, 130, 246, 0.4)',
  },

  // Blur effects
  blur: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '48px',
  },

  // Responsive values for different screen sizes
  responsive: {
    spacing: {
      container: {
        xs: '1rem',
        sm: '2rem',
        md: '3rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      gutter: {
        xs: '1rem',
        sm: '1.5rem',
        md: '2rem',
        lg: '2.5rem',
        xl: '3rem',
      }
    }
  }
} as const;

// Generate CSS variable mapping for themes
export const cssVars = {
  light: createCssVarNames('theme', lightTheme),
  dark: createCssVarNames('theme', darkTheme),
};

// Helper to get a theme by its mode
export const getTheme = (mode: ThemeMode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Helper to get CSS variables value from theme
export const getCssVar = (themeKey: string, mode: ThemeMode = 'light') => {
  const vars = mode === 'dark' ? cssVars.dark : cssVars.light;
  return vars[themeKey] || '';
};

// Helper to get a value from the theme using dot notation
export const getThemeValue = (path: string, mode: ThemeMode = 'light') => {
  const theme = getTheme(mode);
  const keys = path.split('.');
  let value: unknown = theme;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
    if (value === undefined) return undefined;
  }
  
  return value;
};

// Media query helpers for responsive design
export const media = {
  up: (breakpoint: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint: keyof typeof breakpoints) => 
    `@media (max-width: ${breakpoints[breakpoint]})`,
  between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) => 
    `@media (min-width: ${breakpoints[min]}) and (max-width: ${breakpoints[max]})`,
};

// Types
export type Theme = typeof lightTheme;
export type ThemeColors = Theme['colors'];
export type ThemeShadows = Theme['shadows'];
export type ThemeResponsive = Theme['responsive'];
