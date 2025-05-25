import { useTheme } from '@/context/ThemeProvider';
import { lightTheme, darkTheme, getTheme, type ThemeMode } from '@/styles';

/**
 * Theme utilities hook
 * Tema ile ilgili yardımcı fonksiyonlar ve değerler sağlar
 */
export const useThemeUtils = () => {
  const { theme, setTheme, toggleTheme } = useTheme();

  // Mevcut tema objesini al
  const currentTheme = getTheme(theme);

  // Tema değerlerine kolay erişim
  const colors = currentTheme.colors;
  const shadows = currentTheme.shadows;

  // Tema durumu kontrolleri
  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  // CSS custom property değerlerini al
  const getCSSVar = (property: string): string => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim();
  };

  // Renk değerlerini RGB formatında al
  const getRGBColor = (cssVar: string): string => {
    return `rgb(${getCSSVar(cssVar)})`;
  };

  // Renk değerlerini alpha ile al
  const getRGBAColor = (cssVar: string, alpha: number): string => {
    return `rgba(${getCSSVar(cssVar)}, ${alpha})`;
  };

  // Conditional theme classes
  const getThemeClass = (lightClass: string, darkClass: string): string => {
    return isDark ? darkClass : lightClass;
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
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
    localStorage.removeItem('theme');
  };

  return {
    // Theme state
    theme,
    currentTheme,
    isDark,
    isLight,
    
    // Theme objects
    lightTheme,
    darkTheme,
    colors,
    shadows,
    
    // Theme actions
    setTheme,
    toggleTheme,
    resetToSystemTheme,
    
    // Utilities
    getCSSVar,
    getRGBColor,
    getRGBAColor,
    getThemeClass,
    getSystemTheme,
    getSavedTheme,
  };
};
