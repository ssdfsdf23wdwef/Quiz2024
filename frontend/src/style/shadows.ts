/**
 * Gölge stilleri
 * Uygulama genelinde kullanılacak gölge ve yükseklik değerleri
 */

// Temel gölge stilleri
export const boxShadow = {
  none: "none",
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  
  // Özel gölgeler
  soft: "0 2px 15px 0 rgba(0, 0, 0, 0.05)",
  light: "0 0 10px rgba(0, 0, 0, 0.035)",
  focused: "0 0 0 3px rgba(99, 102, 241, 0.3)",
  smooth: "0 10px 30px -5px rgba(0, 0, 0, 0.1)",
  elevated: "0 20px 30px -10px rgba(0, 0, 0, 0.15)",
  sharpBottom: "0 8px 16px -8px rgba(0, 0, 0, 0.15)",
  popup: "0 10px 40px -10px rgba(0, 0, 0, 0.2)",
};

// Renk gölgeleri
export const coloredShadow = {
  primary: {
    sm: "0 1px 3px 0 rgba(79, 70, 229, 0.2)",
    md: "0 4px 6px -1px rgba(79, 70, 229, 0.3)",
    lg: "0 10px 15px -3px rgba(79, 70, 229, 0.3), 0 4px 6px -2px rgba(79, 70, 229, 0.2)",
    focused: "0 0 0 3px rgba(79, 70, 229, 0.3)",
  },
  success: {
    sm: "0 1px 3px 0 rgba(34, 197, 94, 0.2)",
    md: "0 4px 6px -1px rgba(34, 197, 94, 0.3)",
    lg: "0 10px 15px -3px rgba(34, 197, 94, 0.3), 0 4px 6px -2px rgba(34, 197, 94, 0.2)",
    focused: "0 0 0 3px rgba(34, 197, 94, 0.3)",
  },
  warning: {
    sm: "0 1px 3px 0 rgba(245, 158, 11, 0.2)",
    md: "0 4px 6px -1px rgba(245, 158, 11, 0.3)",
    lg: "0 10px 15px -3px rgba(245, 158, 11, 0.3), 0 4px 6px -2px rgba(245, 158, 11, 0.2)",
    focused: "0 0 0 3px rgba(245, 158, 11, 0.3)",
  },
  danger: {
    sm: "0 1px 3px 0 rgba(239, 68, 68, 0.2)",
    md: "0 4px 6px -1px rgba(239, 68, 68, 0.3)",
    lg: "0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.2)",
    focused: "0 0 0 3px rgba(239, 68, 68, 0.3)",
  },
};

// Koyu mod için gölgeler
export const darkModeShadow = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)",
  
  // Özel gölgeler
  soft: "0 2px 15px 0 rgba(0, 0, 0, 0.3)",
  light: "0 0 10px rgba(0, 0, 0, 0.2)",
  focused: "0 0 0 3px rgba(139, 92, 246, 0.5)",
  glow: "0 0 15px rgba(139, 92, 246, 0.5)",
};

// UI öğeleri için gölge kombinasyonları
export const uiShadows = {
  card: {
    default: boxShadow.sm,
    hover: boxShadow.md,
    active: boxShadow.lg,
  },
  button: {
    default: boxShadow.xs,
    hover: boxShadow.sm,
    active: boxShadow.inner,
    primary: coloredShadow.primary.sm,
    primaryHover: coloredShadow.primary.md,
  },
  dropdown: {
    default: boxShadow.lg,
    dark: darkModeShadow.lg,
  },
  modal: {
    default: boxShadow.xl,
    dark: darkModeShadow.xl,
  },
  tooltip: {
    default: boxShadow.md,
    dark: darkModeShadow.md,
  },
  popover: {
    default: boxShadow.lg,
    dark: darkModeShadow.lg,
  },
  navbar: {
    default: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    dark: "0 1px 3px 0 rgba(0, 0, 0, 0.4)",
  },
  sidebar: {
    default: "1px 0 3px 0 rgba(0, 0, 0, 0.1)",
    dark: "1px 0 3px 0 rgba(0, 0, 0, 0.4)",
  },
};

// Tüm gölge değişkenlerini gruplandırarak dışa aktar
const shadows = {
  boxShadow,
  coloredShadow,
  darkModeShadow,
  uiShadows,
};

export default shadows; 