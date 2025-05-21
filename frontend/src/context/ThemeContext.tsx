"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// FlowTracker'ı sarmalayan basit bir fonksiyon
const trackThemeStep = (message: string, context: string, metadata?: Record<string, unknown>) => {
  // Loglama işlemini sadece logger ile yapalım, flowTracker ile değil
  // Bu sayede tip uyumsuzluklarını önlemiş oluruz
  logger.debug(
    message,
    context,
    undefined, // error
    undefined, // stack
    { filename: 'ThemeContext.tsx', ...(metadata || {}) }
  );
  
  // Development modunda konsola yazdır
  if (process.env.NODE_ENV === 'development') {
    console.log(`[THEME] ${context}: ${message}`, metadata);
  }
};

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
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 40 }
    );
    
    return () => {
      flowTracker.endSequence(seqId);
      logger.debug(
        'Theme Provider kaldırıldı',
        'ThemeContext',
        undefined, // error
        undefined, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 48 }
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
          undefined, // error
          undefined, // stack
          { filename: 'ThemeContext.tsx', lineNumber: 65, theme: parsedTheme }
        );
        
        trackThemeStep('Tema tercihleri yüklendi', 'ThemeContext');
      }
    } catch (error) {
      logger.warn(
        'Tema tercihleri yüklenirken hata oluştu',
        'ThemeContext.loadPreferences',
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 77 }
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
          undefined, // error
          undefined, // stack
          { filename: 'ThemeContext.tsx', lineNumber: 94, systemPreference: isDark ? "dark" : "light" }
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
        
        trackThemeStep('Sistem teması değişti', 'ThemeContext.mediaQuery', { 
          isDarkMode: mediaQuery.matches 
        });
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
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 136 }
    );
    
    trackThemeStep('Tema modu değiştiriliyor', 'ThemeContext', { mode });
    
    setTheme(prev => ({ ...prev, mode }));
    
    // localStorage'a kaydet
    try {
      const updatedTheme = { ...theme, mode };
      localStorage.setItem('theme-preferences', JSON.stringify(updatedTheme));
    } catch (error) {
      logger.warn(
        'Tema tercihleri kaydedilirken hata oluştu',
        'ThemeContext.setThemeMode',
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 150 }
      );
    }
  }, [theme]);
  
  // Font boyutunu değiştir
  const setFontSize = useCallback((fontSize: "small" | "medium" | "large") => {
    logger.debug(
      `Font boyutu değiştiriliyor: ${fontSize}`,
      'ThemeContext.setFontSize',
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 161 }
    );
    
    trackThemeStep('Font boyutu değiştiriliyor', 'ThemeContext', { fontSize });
    
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
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 184 }
      );
    }
  }, [theme]);
  
  // Azaltılmış hareket özelliğini değiştir
  const toggleReducedMotion = useCallback(() => {
    logger.debug(
      `Azaltılmış hareket değiştiriliyor: ${!theme.reducedMotion}`,
      'ThemeContext.toggleReducedMotion',
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 195 }
    );
    
    trackThemeStep('Azaltılmış hareket değiştiriliyor', 'ThemeContext', { reducedMotion: !theme.reducedMotion });
    
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
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 226 }
      );
    }
  }, [theme]);
  
  // Yüksek kontrast özelliğini değiştir
  const toggleHighContrast = useCallback(() => {
    logger.debug(
      `Yüksek kontrast değiştiriliyor: ${!theme.highContrast}`,
      'ThemeContext.toggleHighContrast',
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 237 }
    );
    
    trackThemeStep('Yüksek kontrast değiştiriliyor', 'ThemeContext', { highContrast: !theme.highContrast });
    
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
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 268 }
      );
    }
  }, [theme]);
  
  // Tema tercihlerini sıfırla
  const resetTheme = useCallback(() => {
    logger.info(
      'Tema tercihleri sıfırlanıyor',
      'ThemeContext.resetTheme',
      undefined, // error
      undefined, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 279 }
    );
    
    trackThemeStep('Tema sıfırlanıyor', 'ThemeContext');
    
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
        undefined, // error
        undefined, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 301 }
      );
    } catch (error) {
      logger.warn(
        'Tema tercihleri sıfırlanırken hata oluştu',
        'ThemeContext.resetTheme',
        error as Error, // error
        (error as Error).stack, // stack
        { filename: 'ThemeContext.tsx', lineNumber: 307 }
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
      undefined, // error
      undefined, // stack
      {
        filename: 'ThemeContext.tsx',
        lineNumber: 356,
        mode: currentMode,
        isDarkMode,
        fontSize: theme.fontSize,
        reducedMotion: theme.reducedMotion,
        highContrast: theme.highContrast
      }
    );
    
    trackThemeStep('Tema uygulandı', 'ThemeContext.applyTheme', { mode: currentMode });
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
      error, // error
      error.stack, // stack
      { filename: 'ThemeContext.tsx', lineNumber: 399 }
    );
    
    throw error;
  }
  
  return context;
}

export default ThemeContext;
