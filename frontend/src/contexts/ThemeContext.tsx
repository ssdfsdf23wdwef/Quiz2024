"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [isDark, setIsDark] = useState<boolean>(false);

  // Sistem temasını izle
  const listenToSystemThemeChange = useCallback(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setIsDark(mediaQuery.matches);
        updateDocumentClass(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Tema değiştiğinde HTML class'ını güncelle
  const updateDocumentClass = useCallback((isDarkMode: boolean) => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Tema değişikliğini işle
  useEffect(() => {
    // Local storage'dan tema tercihini al
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setTheme(savedTheme);
    }

    // Tema durumunu belirle
    if (theme === "system") {
      const systemIsDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setIsDark(systemIsDark);
      updateDocumentClass(systemIsDark);
    } else {
      const isDarkMode = theme === "dark";
      setIsDark(isDarkMode);
      updateDocumentClass(isDarkMode);
    }

    // Sistem temasını izle
    const cleanup = listenToSystemThemeChange();

    return cleanup;
  }, [theme, listenToSystemThemeChange, updateDocumentClass]);

  // Temayı değiştir ve local storage'a kaydet
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, []);

  // Açık/koyu tema arasında geçiş yap
  const toggleTheme = useCallback(() => {
    const newTheme = isDark ? "light" : "dark";
    handleThemeChange(newTheme);
  }, [isDark, handleThemeChange]);

  // Context değerini memoize et - gereksiz yeniden render'ları önlemek için
  const contextValue = useMemo(() => ({
    theme, 
    setTheme: handleThemeChange, 
    isDark, 
    toggleTheme
  }), [theme, handleThemeChange, isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
