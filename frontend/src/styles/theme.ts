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
      primary: '#f9fafe', // Slightly bluish white for a fresh look
      secondary: '#ffffff',
      tertiary: '#f0f4fa', // Slightly cooler tone
      elevated: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.45)', // Slightly darker, more readable overlay
    },

    // Text colors
    text: {
      primary: '#0f172a', // Deep navy for better readability
      secondary: '#334155', // Still dark but slightly lighter
      tertiary: '#64748b',
      disabled: '#94a3b8',
      inverse: '#ffffff', // Pure white for contrast on dark backgrounds
      link: '#2563eb', // Vibrant blue for links
      'link-hover': '#1d4ed8',
    },

    // Border colors
    border: {
      primary: '#e2e8f0',
      secondary: '#f1f5f9',
      tertiary: '#cbd5e1',
      focus: '#3b82f6',
    },

    // Brand colors
    brand: {
      primary: '#3b82f6', // Bright blue as primary brand color
      'primary-hover': '#2563eb',
      'primary-active': '#1d4ed8',
      secondary: '#8b5cf6', // Purple as secondary
      'secondary-hover': '#7c3aed',
      accent: '#f59e0b', // Warm yellow-orange as accent
      'accent-hover': '#d97706',
    },

    // State colors
    state: {
      success: '#10b981', // Vibrant green
      'success-bg': '#ecfdf5', // Subtle green background
      'success-border': '#6ee7b7', // Visible but not harsh border
      warning: '#f59e0b', // Warm amber
      'warning-bg': '#fffbeb', // Soft yellow background
      'warning-border': '#fcd34d', // Clear border
      error: '#ef4444', // Bright red
      'error-bg': '#fef2f2', // Light red background
      'error-border': '#fca5a5', // Noticeable red border
      info: '#3b82f6', // Bright blue
      'info-bg': '#eff6ff', // Light blue background
      'info-border': '#93c5fd', // Blue border
    },

    // Interactive colors
    interactive: {
      hover: '#f1f5f9', // Slightly darker on hover for better feedback
      active: '#e2e8f0', // Darker on active for clear press state
      disabled: '#f1f5f9',
      selected: '#dbeafe', // Light blue selected state
      focus: 'rgba(59, 130, 246, 0.25)', // Slightly more visible focus outline
    },
  },

  // Shadows
  shadows: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.04)', // More subtle shadow
    sm: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 10px 10px -5px rgba(15, 23, 42, 0.03)',
    '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
    inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.04)',
    none: 'none',
    highlight: '0 0 0 3px rgba(59, 130, 246, 0.3)', // Slightly more visible highlight
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
