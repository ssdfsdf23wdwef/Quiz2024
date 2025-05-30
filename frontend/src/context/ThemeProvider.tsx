'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeMode } from '@/styles/theme';

// Enhanced theme preferences interface
export interface ThemePreferences {
  mode: ThemeMode;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

// Comprehensive theme context interface
interface ThemeContextType {
  // Basic theme properties
  theme: ThemePreferences;
  currentMode: ThemeMode; // Resolved mode (system -> light/dark)
  isDarkMode: boolean;
  isSystemTheme: boolean;
  
  // Theme mode controls
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Enhanced accessibility controls
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
  
  // Legacy compatibility methods
  setThemeMode: (mode: ThemeMode) => void;
}

// Default theme preferences
const defaultThemePreferences: ThemePreferences = {
  mode: 'system',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setThemeState] = useState<ThemePreferences>(defaultThemePreferences);
  const [currentMode, setCurrentMode] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if using system theme
  const isSystemTheme = theme.mode === 'system';

  // Get system theme preference
  const getSystemTheme = (): ThemeMode => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Load theme preferences from localStorage on mount
  useEffect(() => {
    if (!mounted) return;

    try {
      const savedPreferences = localStorage.getItem('theme-preferences');
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences) as ThemePreferences;
        setThemeState(parsedPreferences);
      } else {
        // Migrate from old theme storage
        const oldTheme = localStorage.getItem('theme') as ThemeMode;
        if (oldTheme) {
          setThemeState(prev => ({ ...prev, mode: oldTheme }));
          localStorage.removeItem('theme'); // Clean up old storage
        }
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
      setThemeState({ ...defaultThemePreferences, mode: defaultTheme });
    }
  }, [mounted, defaultTheme]);

  // Determine and apply the current effective theme mode
  useEffect(() => {
    if (!mounted) return;

    const updateCurrentMode = () => {
      let effectiveMode: ThemeMode;
      
      if (theme.mode === 'system') {
        effectiveMode = getSystemTheme();
      } else {
        effectiveMode = theme.mode;
      }
      
      setCurrentMode(effectiveMode);
      setIsDarkMode(effectiveMode === 'dark');
      applyThemeToDOM(effectiveMode);
    };

    updateCurrentMode();

    // Listen for system theme changes
    if (theme.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        if (theme.mode === 'system') {
          updateCurrentMode();
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [theme.mode, mounted]);

  // Apply theme and accessibility preferences to DOM
  const applyThemeToDOM = useCallback((effectiveMode: ThemeMode) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Apply theme mode classes
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveMode);

    // Apply font size classes
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (theme.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
        break;
    }

    // Apply accessibility classes
    if (theme.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (theme.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [theme.fontSize, theme.reducedMotion, theme.highContrast]);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: ThemePreferences) => {
    try {
      localStorage.setItem('theme-preferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }, []);

  // Theme mode controls
  const setTheme = useCallback((newMode: ThemeMode) => {
    const newPreferences = { ...theme, mode: newMode };
    setThemeState(newPreferences);
    savePreferences(newPreferences);
  }, [theme, savePreferences]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(mode);
  }, [setTheme]);

  const toggleTheme = useCallback(() => {
    if (theme.mode === 'system') {
      const systemTheme = getSystemTheme();
      const newMode = systemTheme === 'light' ? 'dark' : 'light';
      setTheme(newMode);
    } else {
      const newMode = theme.mode === 'light' ? 'dark' : 'light';
      setTheme(newMode);
    }
  }, [theme.mode, setTheme]);

  // Accessibility controls
  const setFontSize = useCallback((fontSize: 'small' | 'medium' | 'large') => {
    const newPreferences = { ...theme, fontSize };
    setThemeState(newPreferences);
    savePreferences(newPreferences);
  }, [theme, savePreferences]);

  const toggleReducedMotion = useCallback(() => {
    const newPreferences = { ...theme, reducedMotion: !theme.reducedMotion };
    setThemeState(newPreferences);
    savePreferences(newPreferences);
  }, [theme, savePreferences]);

  const toggleHighContrast = useCallback(() => {
    const newPreferences = { ...theme, highContrast: !theme.highContrast };
    setThemeState(newPreferences);
    savePreferences(newPreferences);
  }, [theme, savePreferences]);

  const resetTheme = useCallback(() => {
    setThemeState(defaultThemePreferences);
    try {
      localStorage.removeItem('theme-preferences');
      localStorage.removeItem('theme'); // Clean up old storage
    } catch (error) {
      console.warn('Failed to reset theme preferences:', error);
    }
  }, []);

  // Apply DOM changes when theme changes
  useEffect(() => {
    applyThemeToDOM(currentMode);
  }, [currentMode, applyThemeToDOM]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  const value: ThemeContextType = {
    theme,
    currentMode,
    isDarkMode,
    isSystemTheme,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    resetTheme,
    setThemeMode, // Legacy compatibility
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
