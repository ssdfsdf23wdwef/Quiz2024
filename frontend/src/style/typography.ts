/**
 * Tipografi stilleri
 * Font ailesi, boyutları, ağırlıkları ve satır yükseklikleri burada tanımlanır
 */

// Font ailesi
export const fontFamily = {
  sans: [
    "Inter",
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
  mono: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
};

// Font boyutları
export const fontSize = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
  "6xl": "3.75rem", // 60px
  "7xl": "4.5rem", // 72px
  "8xl": "6rem", // 96px
  "9xl": "8rem", // 128px
};

// Font ağırlıkları
export const fontWeight = {
  thin: "100",
  extralight: "200",
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

// Satır yükseklikleri
export const lineHeight = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
  // Mutlak değerler
  "3": ".75rem", // 12px
  "4": "1rem", // 16px
  "5": "1.25rem", // 20px
  "6": "1.5rem", // 24px
  "7": "1.75rem", // 28px
  "8": "2rem", // 32px
  "9": "2.25rem", // 36px
  "10": "2.5rem", // 40px
};

// Harf aralığı
export const letterSpacing = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
};

// Paragraf stilleri
export const paragraphStyles = {
  default: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.relaxed,
    marginBottom: "1rem",
  },
  lead: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    marginBottom: "1.5rem",
    fontWeight: fontWeight.normal,
  },
  small: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.normal,
    marginBottom: "0.75rem",
  },
};

// Başlık stilleri
export const headingStyles = {
  h1: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    marginBottom: "1.5rem",
  },
  h2: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    marginBottom: "1.25rem",
  },
  h3: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    marginBottom: "1rem",
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    marginBottom: "0.75rem",
  },
  h5: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    marginBottom: "0.5rem",
  },
  h6: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    marginBottom: "0.5rem",
  },
};

// Tüm tipografi değişkenlerini gruplandırarak dışa aktar
const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  paragraphStyles,
  headingStyles,
};

export default typography; 