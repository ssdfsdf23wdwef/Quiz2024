import { useTheme } from '@/context/ThemeProvider';
import { lightTheme, darkTheme, getTheme, getCssVar, getThemeValue, media, type ThemeMode } from '@/styles/theme';

/**
 * Theme utilities hook
 * Tema ile ilgili yardımcı fonksiyonlar ve değerler sağlar
 */
export const useThemeUtils = () => {
  const { theme, setTheme, toggleTheme, isDarkMode, isSystemTheme } = useTheme();

  // Mevcut tema objesini al
  const currentTheme = getTheme(isDarkMode ? 'dark' : 'light');

  // Tema değerlerine kolay erişim
  const colors = currentTheme.colors;
  const shadows = currentTheme.shadows;
  const responsive = currentTheme.responsive;

  // CSS custom property değerlerini al
  const getVar = (property: string): string => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim();
  };

  // Theme CSS değişkenlerini al (--theme-colors-brand-primary gibi)
  const getThemeVar = (varName: string): string => {
    return getVar(`--theme-${varName}`);
  };

  // Renk değerlerini RGB formatında al
  const getRGBColor = (themeVar: string): string => {
    return `rgb(${getThemeVar(themeVar)})`;
  };

  // Renk değerlerini alpha ile al
  const getRGBAColor = (themeVar: string, alpha: number): string => {
    return `rgba(${getThemeVar(themeVar)}, ${alpha})`;
  };

  // Tema değerine dot notation ile erişim (örn: "colors.brand.primary")
  const getValue = (path: string) => {
    return getThemeValue(path, isDarkMode ? 'dark' : 'light');
  };

  // Conditional theme classes
  const getThemeClass = (lightClass: string, darkClass: string): string => {
    return isDarkMode ? darkClass : lightClass;
  };



  // Sistem tercihi algılama
  const getSystemTheme = (): ThemeMode => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // LocalStorage'dan tema okuma
  const getSavedTheme = (): ThemeMode | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('theme') as ThemeMode | null;
  };

  // Tema sıfırlama (sistem tercihine dön)
  const resetToSystemTheme = () => {
    setTheme('system');
  };

  return {
    // Theme state
    theme,
    currentTheme,
    isDark: isDarkMode,
    isLight: !isDarkMode,
    isSystemTheme,
    
    // Theme objects
    lightTheme,
    darkTheme,
    colors,
    shadows,
    responsive,
    
    // Theme actions
    setTheme,
    toggleTheme,
    resetToSystemTheme,
    
    // Utilities
    getVar,
    getThemeVar,
    getRGBColor,
    getRGBAColor,
    getValue,
    getThemeClass,
    getSystemTheme,
    getSavedTheme,
    
    // CSS Variables access
    cssVars: {
      // Background colors
      bgPrimary: 'colors-background-primary',
      bgSecondary: 'colors-background-secondary', 
      bgTertiary: 'colors-background-tertiary',
      bgElevated: 'colors-background-elevated',
      
      // Text colors
      textPrimary: 'colors-text-primary',
      textSecondary: 'colors-text-secondary',
      textTertiary: 'colors-text-tertiary',
      textDisabled: 'colors-text-disabled',
      textInverse: 'colors-text-inverse',
      
      // Border colors
      borderPrimary: 'colors-border-primary',
      borderSecondary: 'colors-border-secondary',
      borderFocus: 'colors-border-focus',
      
      // Brand colors
      brandPrimary: 'colors-brand-primary',
      brandSecondary: 'colors-brand-secondary',
      brandAccent: 'colors-brand-accent',
      
      // State colors
      success: 'colors-state-success',
      warning: 'colors-state-warning',
      error: 'colors-state-error',
      info: 'colors-state-info',
      
      // Shadows
      shadowSm: 'shadows-sm',
      shadowMd: 'shadows-md',
      shadowLg: 'shadows-lg',
    }
  };
};
