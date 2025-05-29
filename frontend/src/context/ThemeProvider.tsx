'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '@/styles/theme';
import '@/styles/theme.css'; // Import the theme CSS variables

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isSystemTheme: boolean;
}

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
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine if using system theme
  const isSystemTheme = theme === 'system';

  // Get system theme preference
  const getSystemTheme = (): ThemeMode => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    if (!mounted) return;

    const savedTheme = localStorage.getItem('theme') as ThemeMode || defaultTheme;
    setThemeState(savedTheme);
    
    // Initial theme application
    const effectiveTheme = savedTheme === 'system' ? getSystemTheme() : savedTheme;
    setIsDarkMode(effectiveTheme === 'dark');
    applyTheme(effectiveTheme);
  }, [mounted, defaultTheme]);

  // Apply theme to document
  const applyTheme = (newTheme: ThemeMode) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const effectiveTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    
    // Set dark mode state
    setIsDarkMode(effectiveTheme === 'dark');
    
    // Update classes for theme styling
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    // If currently using system theme, explicitly set to opposite of current system preference
    if (theme === 'system') {
      const systemTheme = getSystemTheme();
      const newTheme = systemTheme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    } else {
      // Otherwise toggle between light and dark
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
    }
  };

  // Listen to system theme changes (only apply if using system theme)
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = getSystemTheme();
        setIsDarkMode(systemTheme === 'dark');
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // React to theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode,
    isSystemTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
