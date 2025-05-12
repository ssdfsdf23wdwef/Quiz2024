"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getLogger, getFlowTracker, trackFlow } from "@/lib/logger.utils";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// Tema seçenekleri
export type ThemeMode = "light" | "dark" | "system";

// Tema renkleri
export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  // Diğer tema renkleri...
};

// Tema özellikleri
export type ThemePreferences = {
  mode: ThemeMode;
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  highContrast: boolean;
  colors: ThemeColors;
};

// Context tipi
interface ThemeContextType {
  theme: ThemePreferences;
  currentMode: ThemeMode; // Gerçek uygulanan mod (system seçildiğinde bile)
  isDarkMode: boolean; // Kolay erişim için dark mode durumu
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
}

// Tema için varsayılan değerler
const defaultThemePreferences: ThemePreferences = {
  mode: "system",
  fontSize: "medium",
  reducedMotion: false,
  highContrast: false,
  colors: {
    primary: "#3B82F6", // Mavi
    secondary: "#8B5CF6", // Mor
    accent: "#10B981", // Yeşil
  }
};

// Context oluşturma
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider bileşeni
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Tema durumu
  const [theme, setTheme] = useState<ThemePreferences>(defaultThemePreferences);
  const [currentMode, setCurrentMode] = useState<ThemeMode>("system");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Akış izleme
  useEffect(() => {
    const seqId = flowTracker.startSequence('ThemeInitialization');
    
    logger.info(
      'Theme Provider başlatıldı',
      'ThemeContext',
      'ThemeContext.tsx',
      40
    );
    
    return () => {
      flowTracker.endSequence(seqId);
      logger.debug(
        'Theme Provider kaldırıldı',
        'ThemeContext',
        'ThemeContext.tsx',
        48
      );
    };
  }, []);
  
  // localStorage'dan tema tercihlerini yükle
  useEffect(() => {
    // Tarayıcı ortamı kontrolü
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) return;
    
    try {
      const savedTheme = localStorage.getItem('theme-preferences');
      
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme) as ThemePreferences;
        setTheme(parsedTheme);
        
        logger.debug(
          'Kaydedilmiş tema tercihleri yüklendi',
          'ThemeContext.loadPreferences',
          'ThemeContext.tsx',
          65,
          { theme: parsedTheme }
        );
        
        flowTracker.trackStep(
          'Theme', 
          'Tema tercihleri yüklendi', 
          'ThemeContext'
        );
      }
    } catch (error) {
      logger.warn(
        'Tema tercihleri yüklenirken hata oluştu',
        'ThemeContext.loadPreferences',
        'ThemeContext.tsx',
        77,
        { error }
      );
    }
  }, []);
  
  // Gerçek tema modunu belirle
  useEffect(() => {
    // Tarayıcı ortamı kontrolü
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) return;
    
    const updateActualMode = () => {
      if (theme.mode === "system") {
        // Sistem teması için medya sorgusunu kontrol et
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setCurrentMode(isDark ? "dark" : "light");
        setIsDarkMode(isDark);
        
        logger.debug(
          `Sistem teması kullanılıyor: ${isDark ? "dark" : "light"}`,
          'ThemeContext.updateActualMode',
          'ThemeContext.tsx',
          94,
          { systemPreference: isDark ? "dark" : "light" }
        );
      } else {
        // Kullanıcı teması
        setCurrentMode(theme.mode);
        setIsDarkMode(theme.mode === "dark");
      }
    };
    
    // İlk yükleme
    updateActualMode();
    
    // Sistem teması değişikliklerini izle
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme.mode === "system") {
        updateActualMode();
        
        flowTracker.trackStep(
          'Theme', 
          'Sistem teması değişti', 
          'ThemeContext.mediaQuery',
          { 
            isDarkMode: mediaQuery.matches 
          }
        );
      }
    };
    
    // Olay dinleyici ekle
    mediaQuery.addEventListener("change", handleChange);
    
    // Temizleme
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme.mode]);
  
  // Tema modunu değiştir
  const setThemeMode = useCallback((mode: ThemeMode) => {
    logger.debug(
      `Tema modu değiştiriliyor: ${mode}`,
      'ThemeContext.setThemeMode',
      'ThemeContext.tsx',
      136
    );
    
    flowTracker.trackStateChange('themeMode', 'ThemeContext', theme.mode, mode);
    
    setTheme(prev => ({ ...prev, mode }));
    
    // localStorage'a kaydet
    try {
      const updatedTheme = { ...theme, mode };
      localStorage.setItem('theme-preferences', JSON.stringify(updatedTheme));
    } catch (error) {
      logger.warn(
        'Tema tercihleri kaydedilirken hata oluştu',
        'ThemeContext.setThemeMode',
        'ThemeContext.tsx',
        150,
        { error }
      );
    }
  }, [theme]);
  
  // Font boyutunu değiştir
  const setFontSize = useCallback((fontSize: "small" | "medium" | "large") => {
    logger.debug(
      `Font boyutu değiştiriliyor: ${fontSize}`,
      'ThemeContext.setFontSize',
      'ThemeContext.tsx',
      161
    );
    
    flowTracker.trackStateChange('fontSize', 'ThemeContext', theme.fontSize, fontSize);
    
    setTheme(prev => ({ ...prev, fontSize }));
    
    // localStorage'a kaydet
    try {
      const updatedTheme = { ...theme, fontSize };
      localStorage.setItem('theme-preferences', JSON.stringify(updatedTheme));
      
      // HTML kök elemanına font boyutu sınıfını ekle
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
      
      if (fontSize === 'small') {
        document.documentElement.classList.add('text-sm');
      } else if (fontSize === 'large') {
        document.documentElement.classList.add('text-lg');
      } else {
        document.documentElement.classList.add('text-base');
      }
    } catch (error) {
      logger.warn(
        'Font boyutu ayarlanırken hata oluştu',
        'ThemeContext.setFontSize',
        'ThemeContext.tsx',
        184,
        { error }
      );
    }
  }, [theme]);
  
  // Azaltılmış hareket özelliğini değiştir
  const toggleReducedMotion = useCallback(() => {
    logger.debug(
      `Azaltılmış hareket değiştiriliyor: ${!theme.reducedMotion}`,
      'ThemeContext.toggleReducedMotion',
      'ThemeContext.tsx',
      195
    );
    
    flowTracker.trackStateChange(
      'reducedMotion', 
      'ThemeContext', 
      theme.reducedMotion, 
      !theme.reducedMotion
    );
    
    setTheme(prev => ({ 
      ...prev, 
      reducedMotion: !prev.reducedMotion 
    }));
    
    // localStorage'a kaydet
    try {
      const updatedTheme = { 
        ...theme, 
        reducedMotion: !theme.reducedMotion 
      };
      
      localStorage.setItem('theme-preferences', JSON.stringify(updatedTheme));
      
      // Azaltılmış hareket sınıfını değiştir
      if (!theme.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch (error) {
      logger.warn(
        'Azaltılmış hareket ayarlanırken hata oluştu',
        'ThemeContext.toggleReducedMotion',
        'ThemeContext.tsx',
        226,
        { error }
      );
    }
  }, [theme]);
  
  // Yüksek kontrast özelliğini değiştir
  const toggleHighContrast = useCallback(() => {
    logger.debug(
      `Yüksek kontrast değiştiriliyor: ${!theme.highContrast}`,
      'ThemeContext.toggleHighContrast',
      'ThemeContext.tsx',
      237
    );
    
    flowTracker.trackStateChange(
      'highContrast', 
      'ThemeContext', 
      theme.highContrast, 
      !theme.highContrast
    );
    
    setTheme(prev => ({ 
      ...prev, 
      highContrast: !prev.highContrast 
    }));
    
    // localStorage'a kaydet
    try {
      const updatedTheme = { 
        ...theme, 
        highContrast: !theme.highContrast 
      };
      
      localStorage.setItem('theme-preferences', JSON.stringify(updatedTheme));
      
      // Yüksek kontrast sınıfını değiştir
      if (!theme.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch (error) {
      logger.warn(
        'Yüksek kontrast ayarlanırken hata oluştu',
        'ThemeContext.toggleHighContrast',
        'ThemeContext.tsx',
        268,
        { error }
      );
    }
  }, [theme]);
  
  // Tema tercihlerini sıfırla
  const resetTheme = useCallback(() => {
    logger.info(
      'Tema tercihleri sıfırlanıyor',
      'ThemeContext.resetTheme',
      'ThemeContext.tsx',
      279
    );
    
    flowTracker.trackStep('Theme', 'Tema sıfırlanıyor', 'ThemeContext');
    
    // Varsayılan değerlere geri dön
    setTheme(defaultThemePreferences);
    
    // localStorage'dan tema tercihlerini kaldır
    try {
      localStorage.removeItem('theme-preferences');
      
      // Sınıfları temizle
      document.documentElement.classList.remove(
        'text-sm', 
        'text-lg', 
        'reduce-motion', 
        'high-contrast'
      );
      
      // Varsayılan sınıfı ekle
      document.documentElement.classList.add('text-base');
      
      logger.debug(
        'Tema tercihleri sıfırlandı',
        'ThemeContext.resetTheme',
        'ThemeContext.tsx',
        301
      );
    } catch (error) {
      logger.warn(
        'Tema tercihleri sıfırlanırken hata oluştu',
        'ThemeContext.resetTheme',
        'ThemeContext.tsx',
        307,
        { error }
      );
    }
  }, []);
  
  // Tema değişikliklerini DOM'a uygula
  useEffect(() => {
    // Dark/Light modu ayarla
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Font boyutunu ayarla
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    
    if (theme.fontSize === 'small') {
      document.documentElement.classList.add('text-sm');
    } else if (theme.fontSize === 'large') {
      document.documentElement.classList.add('text-lg');
    } else {
      document.documentElement.classList.add('text-base');
    }
    
    // Azaltılmış hareket ve kontrast ayarları
    if (theme.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    if (theme.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // CSS değişkenlerini ayarla
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    logger.debug(
      'Tema DOM\'a uygulandı',
      'ThemeContext.applyTheme',
      'ThemeContext.tsx',
      356,
      { 
        mode: currentMode, 
        isDarkMode,
        fontSize: theme.fontSize,
        reducedMotion: theme.reducedMotion,
        highContrast: theme.highContrast
      }
    );
    
    flowTracker.trackStep(
      'Theme', 
      'Tema uygulandı', 
      'ThemeContext.applyTheme',
      { mode: currentMode }
    );
  }, [theme, currentMode, isDarkMode]);
  
  // Provider değeri
  const value = {
    theme,
    currentMode,
    isDarkMode,
    setThemeMode,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    resetTheme
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    const error = new Error('useTheme hook must be used within a ThemeProvider');
    
    logger.error(
      'useTheme hook ThemeProvider dışında kullanıldı',
      'useTheme',
      'ThemeContext.tsx',
      399,
      { stack: error.stack }
    );
    
    throw error;
  }
  
  return context;
}

export default ThemeContext;
