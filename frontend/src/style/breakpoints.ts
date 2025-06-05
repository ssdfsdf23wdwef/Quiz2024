/**
 * Duyarlı tasarım için ekran boyutları
 * Medya sorguları ve duyarlı bileşenler için kullanılır
 */

// Tailwind ile uyumlu ekran boyutları (piksel)
export const screens = {
  xs: '475px',    // Ekstra küçük ekranlar, telefonlar
  sm: '640px',    // Küçük ekranlar, büyük telefonlar
  md: '768px',    // Orta boyutlu ekranlar, tabletler
  lg: '1024px',   // Büyük ekranlar, dizüstü bilgisayarlar
  xl: '1280px',   // Ekstra büyük ekranlar
  '2xl': '1536px' // 2x ekstra büyük ekranlar, masaüstü bilgisayarlar
};

// Ekran boyutlarına göre max-width değerleri
export const screenMaxWidths = {
  xs: '475px',  
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Ekran genişliklerine göre sorgu stringleri
export const mediaQueries = {
  xs: `(min-width: ${screens.xs})`,
  sm: `(min-width: ${screens.sm})`,
  md: `(min-width: ${screens.md})`,
  lg: `(min-width: ${screens.lg})`,
  xl: `(min-width: ${screens.xl})`,
  '2xl': `(min-width: ${screens['2xl']})`,
  
  // Max width sorguları
  maxXs: `(max-width: ${parseInt(screens.xs) - 1}px)`,
  maxSm: `(max-width: ${parseInt(screens.sm) - 1}px)`,
  maxMd: `(max-width: ${parseInt(screens.md) - 1}px)`,
  maxLg: `(max-width: ${parseInt(screens.lg) - 1}px)`,
  maxXl: `(max-width: ${parseInt(screens.xl) - 1}px)`,
  max2xl: `(max-width: ${parseInt(screens['2xl']) - 1}px)`,
  
  // Sadece belirli aralık sorguları
  onlyXs: `(min-width: ${screens.xs}) and (max-width: ${parseInt(screens.sm) - 1}px)`,
  onlySm: `(min-width: ${screens.sm}) and (max-width: ${parseInt(screens.md) - 1}px)`,
  onlyMd: `(min-width: ${screens.md}) and (max-width: ${parseInt(screens.lg) - 1}px)`,
  onlyLg: `(min-width: ${screens.lg}) and (max-width: ${parseInt(screens.xl) - 1}px)`,
  onlyXl: `(min-width: ${screens.xl}) and (max-width: ${parseInt(screens['2xl']) - 1}px)`,
  only2xl: `(min-width: ${screens['2xl']})`,
  
  // Yönelime göre sorgular
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // Sistem tercihleri
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkMode: '(prefers-color-scheme: dark)',
  prefersLightMode: '(prefers-color-scheme: light)',
  
  // Dokunmatik cihazlar
  hover: '(hover: hover)',
  touch: '(hover: none)'
};

// Breakpoint testleri için yardımcı fonksiyonlar
export const isBreakpoint = {
  xs: typeof window !== 'undefined' ? window.matchMedia(mediaQueries.xs).matches : false,
  sm: typeof window !== 'undefined' ? window.matchMedia(mediaQueries.sm).matches : false,
  md: typeof window !== 'undefined' ? window.matchMedia(mediaQueries.md).matches : false,
  lg: typeof window !== 'undefined' ? window.matchMedia(mediaQueries.lg).matches : false,
  xl: typeof window !== 'undefined' ? window.matchMedia(mediaQueries.xl).matches : false,
  '2xl': typeof window !== 'undefined' ? window.matchMedia(mediaQueries['2xl']).matches : false,
};

// Bileşen yerleşim değerleri - ekran boyutlarına göre
export const layout = {
  // Sayfa kenar boşlukları
  pagePadding: {
    xs: '1rem',      // 16px
    sm: '1.5rem',    // 24px
    md: '2rem',      // 32px
    lg: '2.5rem',    // 40px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
  },
  
  // Maksimum içerik genişliği
  contentMaxWidth: {
    xs: '100%',
    sm: '540px',
    md: '720px',
    lg: '960px',
    xl: '1140px',
    '2xl': '1320px',
  },
  
  // Sidebar genişliği
  sidebarWidth: {
    xs: '100%',          // Mobilde tam genişlik
    sm: '100%',          // Mobilde tam genişlik
    md: '250px',         // Tablet ve üzeri
    lg: '280px',         // Masaüstü
    xl: '300px',         // Geniş ekran
    '2xl': '320px',      // Ekstra geniş ekran
  },
  
  // Menü gösterme şekli
  menuStyle: {
    xs: 'drawer',        // Mobilde çekmece menü
    sm: 'drawer',        // Küçük ekranlarda çekmece menü
    md: 'sidebar',       // Tablet ve üzeri yan menü
    lg: 'sidebar',       // Masaüstü yan menü
    xl: 'sidebar',       // Geniş ekran yan menü
    '2xl': 'sidebar',    // Ekstra geniş ekran yan menü
  },
};

// Grid sütun sayıları
export const gridColumns = {
  xs: 2,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  '2xl': 6,
};

// Tüm duyarlı tasarım değişkenlerini gruplandırarak dışa aktar
const breakpoints = {
  screens,
  screenMaxWidths,
  mediaQueries,
  isBreakpoint,
  layout,
  gridColumns,
};

export default breakpoints; 