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
import theme, { ThemeMode, ThemePreferences, defaultThemePreferences } from "@/style/theme";
import { useTheme as useNextTheme } from "next-themes";

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
    'ThemeContext.tsx',
    undefined,
    metadata
  );
  
  // Development modunda konsola yazdır
  if (process.env.NODE_ENV === 'development') {
    console.log(`[THEME] ${context}: ${message}`, metadata);
  }
};

// Context tipi
interface ThemeContextType {
  preferences: ThemePreferences;
  isDarkMode: boolean; // Kolay erişim için dark mode durumu
  currentAppearance: "light" | "dark"; // Gerçek görünüm (system seçiliyse bile)
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
  getTransparentColor: (color: string, opacity: number) => string;
  getColorShade: (color: string, percentage: number) => string;
}

// Context oluşturma
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider bileşeni
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Next-themes ile entegrasyon
  const { resolvedTheme, setTheme } = useNextTheme();
  
  // Tema durumu
  const [preferences, setPreferences] = useState<ThemePreferences>(defaultThemePreferences);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentAppearance, setCurrentAppearance] = useState<"light" | "dark">("light");
  
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
        setPreferences(parsedTheme);
        
        // Next-themes ile senkronize et
        setTheme(parsedTheme.mode);
        
        logger.debug(
          'Kaydedilmiş tema tercihleri yüklendi',
          'ThemeContext.loadPreferences',
          'ThemeContext.tsx',
          65,
          { theme: parsedTheme }
        );
        
        trackThemeStep('Tema tercihleri yüklendi', 'ThemeContext');
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
  }, [setTheme]);
  
  // Resolved tema değişikliklerini izle
  useEffect(() => {
    if (resolvedTheme) {
      const isCurrentlyDark = resolvedTheme === 'dark';
      setIsDarkMode(isCurrentlyDark);
      setCurrentAppearance(isCurrentlyDark ? "dark" : "light");
      
      logger.debug(
        `Gerçek tema: ${resolvedTheme}`,
        'ThemeContext.resolvedTheme',
        'ThemeContext.tsx',
        95,
        { resolvedTheme }
      );
    }
  }, [resolvedTheme]);
  
  // Tema modunu değiştir
  const setThemeMode = useCallback((mode: ThemeMode) => {
    logger.debug(
      `Tema modu değiştiriliyor: ${mode}`,
      'ThemeContext.setThemeMode',
      'ThemeContext.tsx',
      106
    );
    
    trackThemeStep('Tema modu değiştiriliyor', 'ThemeContext', { mode });
    
    // Next-themes ile senkronize et
    setTheme(mode);
    
    setPreferences(prev => ({ ...prev, mode }));
    
    // localStorage'a kaydet
    try {
      const updatedPrefs = { ...preferences, mode };
      localStorage.setItem('theme-preferences', JSON.stringify(updatedPrefs));
    } catch (error) {
      logger.warn(
        'Tema tercihleri kaydedilirken hata oluştu',
        'ThemeContext.setThemeMode',
        'ThemeContext.tsx',
        122,
        { error }
      );
    }
  }, [preferences, setTheme]);
  
  // Font boyutunu değiştir
  const setFontSize = useCallback((fontSize: "small" | "medium" | "large") => {
    logger.debug(
      `Font boyutu değiştiriliyor: ${fontSize}`,
      'ThemeContext.setFontSize',
      'ThemeContext.tsx',
      133
    );
    
    trackThemeStep('Font boyutu değiştiriliyor', 'ThemeContext', { fontSize });
    
    setPreferences(prev => ({ ...prev, fontSize }));
    
    // localStorage'a kaydet
    try {
      const updatedPrefs = { ...preferences, fontSize };
      localStorage.setItem('theme-preferences', JSON.stringify(updatedPrefs));
      
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
        156,
        { error }
      );
    }
  }, [preferences]);
  
  // Azaltılmış hareket özelliğini değiştir
  const toggleReducedMotion = useCallback(() => {
    const newValue = !preferences.reducedMotion;
    
    logger.debug(
      `Azaltılmış hareket değiştiriliyor: ${newValue}`,
      'ThemeContext.toggleReducedMotion',
      'ThemeContext.tsx',
      168
    );
    
    trackThemeStep('Azaltılmış hareket değiştiriliyor', 'ThemeContext', { reducedMotion: newValue });
    
    setPreferences(prev => ({ 
      ...prev, 
      reducedMotion: newValue 
    }));
    
    // localStorage'a kaydet
    try {
      const updatedPrefs = { 
        ...preferences, 
        reducedMotion: newValue 
      };
      
      localStorage.setItem('theme-preferences', JSON.stringify(updatedPrefs));
      
      // Azaltılmış hareket sınıfını değiştir
      if (newValue) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch (error) {
      logger.warn(
        'Azaltılmış hareket ayarlanırken hata oluştu',
        'ThemeContext.toggleReducedMotion',
        'ThemeContext.tsx',
        195,
        { error }
      );
    }
  }, [preferences]);
  
  // Yüksek kontrast özelliğini değiştir
  const toggleHighContrast = useCallback(() => {
    const newValue = !preferences.highContrast;
    
    logger.debug(
      `Yüksek kontrast değiştiriliyor: ${newValue}`,
      'ThemeContext.toggleHighContrast',
      'ThemeContext.tsx',
      207
    );
    
    trackThemeStep('Yüksek kontrast değiştiriliyor', 'ThemeContext', { highContrast: newValue });
    
    setPreferences(prev => ({ 
      ...prev, 
      highContrast: newValue 
    }));
    
    // localStorage'a kaydet
    try {
      const updatedPrefs = { 
        ...preferences, 
        highContrast: newValue 
      };
      
      localStorage.setItem('theme-preferences', JSON.stringify(updatedPrefs));
      
      // Yüksek kontrast sınıfını değiştir
      if (newValue) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    } catch (error) {
      logger.warn(
        'Yüksek kontrast ayarlanırken hata oluştu',
        'ThemeContext.toggleHighContrast',
        'ThemeContext.tsx',
        234,
        { error }
      );
    }
  }, [preferences]);
  
  // Tema tercihlerini sıfırla
  const resetTheme = useCallback(() => {
    logger.info(
      'Tema tercihleri sıfırlanıyor',
      'ThemeContext.resetTheme',
      'ThemeContext.tsx',
      245
    );
    
    trackThemeStep('Tema sıfırlanıyor', 'ThemeContext');
    
    // Varsayılan değerlere geri dön
    setPreferences(defaultThemePreferences);
    
    // Next-themes ile senkronize et
    setTheme(defaultThemePreferences.mode);
    
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
        272
      );
    } catch (error) {
      logger.warn(
        'Tema tercihleri sıfırlanırken hata oluştu',
        'ThemeContext.resetTheme',
        'ThemeContext.tsx',
        278,
        { error }
      );
    }
  }, [setTheme]);
  
  // Tema değişikliklerini DOM'a uygula
  useEffect(() => {
    // Font boyutunu ayarla
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    
    if (preferences.fontSize === 'small') {
      document.documentElement.classList.add('text-sm');
    } else if (preferences.fontSize === 'large') {
      document.documentElement.classList.add('text-lg');
    } else {
      document.documentElement.classList.add('text-base');
    }
    
    // Azaltılmış hareket ve kontrast ayarları
    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    logger.debug(
      'Tema tercihleri DOM\'a uygulandı',
      'ThemeContext.applyTheme',
      'ThemeContext.tsx',
      311,
      { 
        mode: preferences.mode,
        appearance: currentAppearance,
        fontSize: preferences.fontSize,
        reducedMotion: preferences.reducedMotion,
        highContrast: preferences.highContrast
      }
    );
    
    trackThemeStep('Tema tercihleri uygulandı', 'ThemeContext.applyTheme', { mode: preferences.mode });
  }, [preferences, currentAppearance]);
  
  // Tema yardımcı fonksiyonlarını dışa aktar
  const getTransparentColor = useCallback((color: string, opacity: number): string => {
    return theme.utils.getTransparentColor(color, opacity);
  }, []);
  
  const getColorShade = useCallback((color: string, percentage: number): string => {
    return theme.utils.getColorShade(color, percentage);
  }, []);
  
  // Provider değeri
  const value = {
    preferences,
    isDarkMode,
    currentAppearance,
    setThemeMode,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    resetTheme,
    getTransparentColor,
    getColorShade
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
      363,
      { stack: error.stack }
    );
    
    throw error;
  }
  
  return context;
}

export default ThemeContext;
