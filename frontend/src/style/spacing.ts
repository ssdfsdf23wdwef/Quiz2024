/**
 * Boşluk ölçü değişkenleri
 * Margin, padding, kenar boşlukları ve aralıkları için kullanılır
 */

// Kenar boşlukları (rem cinsinden)
export const space = {
  0: "0",
  0.5: "0.125rem", // 2px
  1: "0.25rem", // 4px
  1.5: "0.375rem", // 6px
  2: "0.5rem", // 8px
  2.5: "0.625rem", // 10px
  3: "0.75rem", // 12px
  3.5: "0.875rem", // 14px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  7: "1.75rem", // 28px
  8: "2rem", // 32px
  9: "2.25rem", // 36px
  10: "2.5rem", // 40px
  11: "2.75rem", // 44px
  12: "3rem", // 48px
  14: "3.5rem", // 56px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  28: "7rem", // 112px
  32: "8rem", // 128px
  36: "9rem", // 144px
  40: "10rem", // 160px
  44: "11rem", // 176px
  48: "12rem", // 192px
  52: "13rem", // 208px
  56: "14rem", // 224px
  60: "15rem", // 240px
  64: "16rem", // 256px
  72: "18rem", // 288px
  80: "20rem", // 320px
  96: "24rem", // 384px
};

// Sayfa kenar boşlukları - mobil uyumlu
export const pagePadding = {
  mobile: {
    horizontal: space[4], // 16px
    vertical: space[4], // 16px
  },
  tablet: {
    horizontal: space[6], // 24px
    vertical: space[5], // 20px
  },
  desktop: {
    horizontal: space[8], // 32px
    vertical: space[6], // 24px
  },
  wide: {
    horizontal: space[10], // 40px
    vertical: space[8], // 32px
  },
};

// Yerleşim bileşenleri arası mesafeler
export const componentSpacing = {
  xs: space[2], // 8px
  sm: space[3], // 12px
  md: space[4], // 16px
  lg: space[6], // 24px
  xl: space[8], // 32px
  "2xl": space[10], // 40px
};

// Grid gap değerleri
export const gridGap = {
  xs: space[2], // 8px
  sm: space[3], // 12px
  md: space[4], // 16px
  lg: space[6], // 24px
  xl: space[8], // 32px
};

// Bileşen margin değerleri
export const margin = {
  none: "0",
  auto: "auto",
  ...space,
};

// Bileşen padding değerleri
export const padding = {
  none: "0",
  ...space,
};

// Bileşen boyutları
export const sizes = {
  // Yükseklik değerleri
  heights: {
    button: {
      sm: "1.75rem", // 28px
      md: "2.25rem", // 36px
      lg: "2.75rem", // 44px
    },
    input: {
      sm: "1.75rem", // 28px
      md: "2.25rem", // 36px
      lg: "2.75rem", // 44px
    },
    header: "4rem", // 64px
    sidebar: "100vh",
    footer: "15rem", // 240px
  },
  // Genişlik değerleri
  widths: {
    sidebar: {
      collapsed: "4.5rem", // 72px
      expanded: "16rem", // 256px
    },
    container: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
  },
};

// İç içe bileşenler arasındaki boşluk
export const stack = {
  horizontal: {
    xs: space[1], // 4px
    sm: space[2], // 8px
    md: space[4], // 16px
    lg: space[6], // 24px
    xl: space[8], // 32px
  },
  vertical: {
    xs: space[1], // 4px
    sm: space[2], // 8px
    md: space[4], // 16px
    lg: space[6], // 24px
    xl: space[8], // 32px
  },
};

// Tüm boşluk değerlerini gruplandırarak dışa aktar
const spacing = {
  space,
  pagePadding,
  componentSpacing,
  gridGap,
  margin,
  padding,
  sizes,
  stack,
};

export default spacing; 