import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";
import { colors, spacing, borderRadius, typography as typographyTokens, breakpoints, duration, easing } from "./src/styles";

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
<<<<<<< HEAD
  // Dark theme support with class and system preference
  darkMode: ["class", '[data-theme="dark"]'],
=======
  // Koyu tema desteği için `class` stratejisini kullan
  darkMode: "class",
>>>>>>> origin/en-yeni
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
<<<<<<< HEAD
    // Use imported design tokens
    colors,
    spacing,
    borderRadius,
    fontFamily: typographyTokens.fontFamily,
    fontSize: typographyTokens.fontSize,
    fontWeight: typographyTokens.fontWeight,
    lineHeight: typographyTokens.lineHeight,
    letterSpacing: typographyTokens.letterSpacing,
    screens: breakpoints,    
    extend: {
      // CSS custom properties integration with new design system
      backgroundColor: {
        'surface': {
          'primary': 'rgb(var(--color-surface-primary) / <alpha-value>)',
          'secondary': 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          'tertiary': 'rgb(var(--color-surface-tertiary) / <alpha-value>)',
          'elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
          'overlay': 'rgb(var(--color-surface-overlay) / <alpha-value>)',
          'inverse': 'rgb(var(--color-surface-inverse) / <alpha-value>)',
        },
        'state': {
          'success': 'rgb(var(--color-success-bg) / <alpha-value>)',
          'warning': 'rgb(var(--color-warning-bg) / <alpha-value>)',
          'error': 'rgb(var(--color-error-bg) / <alpha-value>)',
          'info': 'rgb(var(--color-info-bg) / <alpha-value>)',
        },
        'interactive': {
          'hover': 'rgb(var(--color-interactive-hover) / <alpha-value>)',
          'active': 'rgb(var(--color-interactive-active) / <alpha-value>)',
          'disabled': 'rgb(var(--color-interactive-disabled) / <alpha-value>)',
          'selected': 'rgb(var(--color-interactive-selected) / <alpha-value>)',
        },
      },
      
      textColor: {
        'semantic': {
          'primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
          'secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          'quaternary': 'rgb(var(--color-text-quaternary) / <alpha-value>)',
          'disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
          'inverse': 'rgb(var(--color-text-inverse) / <alpha-value>)',
          'link': 'rgb(var(--color-text-link) / <alpha-value>)',
          'link-hover': 'rgb(var(--color-text-link-hover) / <alpha-value>)',
        },
        'state': {
          'success': 'rgb(var(--color-success) / <alpha-value>)',
          'warning': 'rgb(var(--color-warning) / <alpha-value>)',
          'error': 'rgb(var(--color-error) / <alpha-value>)',
          'info': 'rgb(var(--color-info) / <alpha-value>)',
        },
      },
      
      borderColor: {
        'semantic': {
          'primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
          'secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
          'tertiary': 'rgb(var(--color-border-tertiary) / <alpha-value>)',
          'focus': 'rgb(var(--color-border-focus) / <alpha-value>)',
        },
        'state': {
          'success': 'rgb(var(--color-border-success) / <alpha-value>)',
          'warning': 'rgb(var(--color-border-warning) / <alpha-value>)',
          'error': 'rgb(var(--color-border-error) / <alpha-value>)',
        },
      },      
      // Box shadows using CSS custom properties
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
      },
      
      // Blur effects
      blur: {
        'xs': 'var(--blur-xs)',
        'sm': 'var(--blur-sm)',
        'md': 'var(--blur-md)',
        'lg': 'var(--blur-lg)',
        'xl': 'var(--blur-xl)',
        '2xl': 'var(--blur-2xl)',
        '3xl': 'var(--blur-3xl)',
      },      
      // Z-index scale for layering
      zIndex: {
        'hide': '-1',
        'auto': 'auto',
        'base': '0',
        'docked': '10',
        'dropdown': '1000',
        'sticky': '1100',
        'banner': '1200',
        'overlay': '1300',
        'modal': '1400',
        'popover': '1500',
        'skipLink': '1600',
        'toast': '1700',
        'tooltip': '1800',
      },
        // Animation durations using design tokens
      transitionDuration: {
        ...duration,
      },
      
      // Animation timing functions using design tokens
      transitionTimingFunction: {
        ...easing,
      },
      // Responsive breakpoints
      screens: breakpoints,
        // Enhanced animations for modern UX
      animation: {
        'fade-in': `fadeIn ${duration.slower} ${easing['ease-out']}`,
        'fade-out': `fadeOut ${duration.normal} ${easing['ease-in']}`,
        'slide-up': `slideUp ${duration.slow} ${easing['ease-out']}`,
        'slide-down': `slideDown ${duration.slow} ${easing['ease-out']}`,
        'slide-left': `slideLeft ${duration.slow} ${easing['ease-out']}`,
        'slide-right': `slideRight ${duration.slow} ${easing['ease-out']}`,
        'scale-in': `scaleIn ${duration.normal} ${easing['ease-out']}`,
        'scale-out': `scaleOut ${duration.normal} ${easing['ease-in']}`,
        'bounce-in': `bounceIn ${duration.slow} ${easing['ease-out-bounce']}`,
        'pulse-soft': `pulseSoft 2s ${easing['ease-in-out']} infinite`,
        'spin-slow': 'spin 3s linear infinite',
        'float': `float 3s ${easing['ease-in-out']} infinite`,
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(1rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-1rem)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(1rem)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-1rem)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
=======
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
>>>>>>> origin/en-yeni
  ],
};

export default config;
