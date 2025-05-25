// Export all style tokens and themes
export { colors } from './colors';
export { lightTheme, darkTheme } from './theme';
export { typography } from './typography';
export { 
  spacing, 
  borderRadius, 
  zIndex, 
  breakpoints, 
  sizes, 
  duration, 
  easing 
} from './tokens';

// Export types
export type { 
  ColorName, 
  ColorShade 
} from './colors';

export type { 
  Theme, 
  ThemeColors, 
  ThemeShadows 
} from './theme';

export type { 
  Typography, 
  TextStyle 
} from './typography';

export type { 
  Spacing, 
  BorderRadius, 
  ZIndex, 
  Breakpoint, 
  Duration, 
  Easing 
} from './tokens';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// Get theme by mode
import { lightTheme, darkTheme } from './theme';
export const getTheme = (mode: ThemeMode) => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
