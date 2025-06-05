/**
 * Stil sistemi ana export noktası
 * Tüm stil modüllerini tek bir dosyadan dışa aktarır
 */

// Stil modüllerini import et
import theme, { ThemeMode, ThemePreferences, defaultThemePreferences } from './theme';
import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import breakpoints from './breakpoints';
import zIndex from './zIndex';
import animations from './animations';

// Tipler
export type { ThemeMode, ThemePreferences };

// Varsayılan değerler
export { defaultThemePreferences };

// Modülleri tek tek dışa aktar
export {
  colors,
  typography,
  spacing,
  shadows,
  breakpoints,
  zIndex,
  animations,
};

// Ana tema nesnesini varsayılan olarak dışa aktar
export default theme; 