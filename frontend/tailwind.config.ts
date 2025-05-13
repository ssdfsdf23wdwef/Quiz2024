import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";

// Stil sisteminden değişkenleri içe aktar
import colors from "./src/style/colors";
import typography_styles from "./src/style/typography";
import spacing from "./src/style/spacing";
import shadows from "./src/style/shadows";
import breakpoints from "./src/style/breakpoints";
import zIndex from "./src/style/zIndex";
import animations from "./src/style/animations";
import theme from "./src/style/theme";

// CSS değer türü için esnek tip
type CSSValue = string | { [key: string]: string | { [key: string]: string } };

const config: Config = {
  // Koyu tema desteği için `class` stratejisini kullan
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Temel tema değerlerini belirle
    screens: breakpoints,
    fontFamily: typography_styles.fontFamily,
    fontSize: typography_styles.fontSize,
    fontWeight: typography_styles.fontWeight,
    lineHeight: typography_styles.lineHeight,
    letterSpacing: typography_styles.letterSpacing,
    zIndex: zIndex,
    
    extend: {
      // Tüm renk değişkenlerini doğrudan stil sisteminden al
      colors: {
        // Ana tema renkleri
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        info: colors.info,
        neutral: colors.neutral,
        
        // Açık tema renkleri
        light: colors.light,
        
        // Koyu tema renkleri
        dark: colors.dark,
      },
      
      // Animasyonlar ve geçişler
      transitionDuration: {
        fastest: `${animations.duration.fastest}s`,
        fast: `${animations.duration.fast}s`,
        normal: `${animations.duration.normal}s`,
        slow: `${animations.duration.slow}s`,
        slowest: `${animations.duration.slowest}s`,
      },
      
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'ease-spring': 'cubic-bezier(0.155, 1.105, 0.295, 1.12)',
        'ease-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'opacity-transform': 'opacity, transform',
      },
      
      // Boşluk değerleri
      spacing: spacing,
      
      // Kenar yuvarlaklığı değerleri
      borderRadius: theme.properties.borderRadius,
      
      // Kenar kalınlığı değerleri
      borderWidth: theme.properties.borderWidth,
      
      // Opaklık değerleri
      opacity: theme.properties.opacity,
      
      // Arkaplan desenleri
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        ...colors.gradients,
      },
      
      // Gölgeler
      boxShadow: shadows,
    },
  },
  
  // CSS değişkenlerine dayalı tema değişimi için
  plugins: [
    forms, 
    typography, 
    aspectRatio,
    // Renk modu değişkenleri için özel eklenti
    function({ addBase }: { addBase: (styles: Record<string, CSSValue>) => void }) {
      addBase({
        // Açık tema (varsayılan) için kök değişkenler
        ':root': {
          // Ana arkaplan ve metin renkleri
          '--background-primary': colors.light.background,
          '--background-secondary': colors.light["background-secondary"],
          '--background-tertiary': colors.light["background-tertiary"],
          '--text-primary': colors.light["text-primary"],
          '--text-secondary': colors.light["text-secondary"],
          '--text-tertiary': colors.light["text-tertiary"],
          '--border-color': colors.light.border,
          '--border-focus': colors.light["border-focus"],
        },
        // Koyu tema için değişkenler
        '.dark': {
          '--background-primary': colors.dark["bg-primary"],
          '--background-secondary': colors.dark["bg-secondary"],
          '--background-tertiary': colors.dark["bg-tertiary"],
          '--text-primary': colors.dark["text-primary"],
          '--text-secondary': colors.dark["text-secondary"],
          '--text-tertiary': colors.dark["text-tertiary"],
          '--border-color': colors.dark.border,
          '--border-focus': colors.dark["border-focus"],
        },
        // Azaltılmış hareket desteği
        '.reduce-motion': {
          '--transition-duration-fast': '0ms',
          '--transition-duration-normal': '0ms',
          '--transition-duration-slow': '0ms',
        },
        // Yüksek kontrast desteği
        '.high-contrast': {
          '--text-primary': '#000000',
          '--text-secondary': '#222222',
          '--border-color': '#000000',
          '.dark &': {
            '--text-primary': '#ffffff',
            '--text-secondary': '#dddddd',
            '--border-color': '#ffffff',
          },
        },
      });
    },
  ],
};

export default config;
