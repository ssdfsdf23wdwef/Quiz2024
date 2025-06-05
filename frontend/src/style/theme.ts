/**
 * Tema değişkenleri
 * Renk, tipografi, boşluk ve diğer stilleri tutarlı bir tema yapısında birleştirir
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import breakpoints from './breakpoints';
import zIndex from './zIndex';
import animations from './animations';

// Tema modları
export type ThemeMode = 'light' | 'dark' | 'system';

// Tema tercihleri için tip
export interface ThemePreferences {
  mode: ThemeMode;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

// Varsayılan tema tercihleri
export const defaultThemePreferences: ThemePreferences = {
  mode: 'system',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

// Ana tema yapısı
const theme = {
  // Renk değişkenleri
  colors,
  
  // Tipografi değişkenleri
  typography,
  
  // Boşluk ve ölçü değişkenleri
  spacing,
  
  // Gölge stilleri
  shadows,
  
  // Duyarlı tasarım için ekran boyutları
  breakpoints,
  
  // z-index değerleri
  zIndex,
  
  // Animasyon değişkenleri
  animations,
  
  // Açık tema spesifik stillemeler
  light: {
    background: {
      primary: colors.light.background,
      secondary: colors.light["background-secondary"],
      tertiary: colors.light["background-tertiary"],
    },
    text: {
      primary: colors.light["text-primary"],
      secondary: colors.light["text-secondary"],
      tertiary: colors.light["text-tertiary"],
    },
    border: colors.light.border,
    borderFocus: colors.light["border-focus"],
    
    // Renk tonları belirli UI elemanları için
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    neutral: colors.neutral,
  },
  
  // Koyu tema spesifik stillemeler
  dark: {
    background: {
      primary: colors.dark["bg-primary"],
      secondary: colors.dark["bg-secondary"],
      tertiary: colors.dark["bg-tertiary"],
    },
    text: {
      primary: colors.dark["text-primary"],
      secondary: colors.dark["text-secondary"],
      tertiary: colors.dark["text-tertiary"],
    },
    border: colors.dark.border,
    borderFocus: colors.dark["border-focus"],
    accent: colors.dark.accent,
    
    // Renk tonları belirli UI elemanları için
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    neutral: colors.neutral,
  },
  
  // Tema özellikleri
  properties: {
    borderRadius: {
      none: '0',
      sm: '0.125rem', // 2px
      DEFAULT: '0.25rem', // 4px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
      '3xl': '1.5rem', // 24px
      full: '9999px',
    },
    borderWidth: {
      none: '0',
      thin: '1px',
      DEFAULT: '1px',
      medium: '2px',
      thick: '3px',
    },
    opacity: {
      0: '0',
      5: '0.05',
      10: '0.1',
      20: '0.2',
      25: '0.25',
      30: '0.3',
      40: '0.4',
      50: '0.5',
      60: '0.6',
      70: '0.7',
      75: '0.75',
      80: '0.8',
      90: '0.9',
      95: '0.95',
      100: '1',
    },
  },
  
  // Tema yardımcı fonksiyonları
  utils: {
    // İki renk arasında geçiş yapar (rgba değeri döndürür)
    getTransparentColor: (color: string, opacity: number): string => {
      // Hex renk değerini RGBA formatına dönüştür
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    
    // Bir renkten renk tonu üretir (daha açık veya koyu)
    getColorShade: (color: string, percentage: number = 0): string => {
      // Hex renk değerini işle
      const hex = color.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);
      
      // Pozitif değerler rengi açar, negatif değerler koyulaştırır
      if (percentage > 0) {
        // Açık ton (beyaza doğru)
        r = Math.min(255, r + Math.round(2.55 * percentage));
        g = Math.min(255, g + Math.round(2.55 * percentage));
        b = Math.min(255, b + Math.round(2.55 * percentage));
      } else if (percentage < 0) {
        // Koyu ton (siyaha doğru)
        const darkPercentage = Math.abs(percentage);
        r = Math.max(0, r - Math.round(2.55 * darkPercentage));
        g = Math.max(0, g - Math.round(2.55 * darkPercentage));
        b = Math.max(0, b - Math.round(2.55 * darkPercentage));
      }
      
      // Değerleri hex formatına çevir
      const toHex = (value: number): string => {
        const hex = value.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },
  },
};

export default theme; 