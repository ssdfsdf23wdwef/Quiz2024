import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";
import { colors, spacing, borderRadius, typography as typographyTokens } from "./src/styles";

const config: Config = {
  // Koyu tema desteği için `class` ve sistem tercihi
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Import edilen design tokens'ları kullan
    colors,
    spacing,
    borderRadius,
    fontFamily: typographyTokens.fontFamily,
    fontSize: typographyTokens.fontSize,
    fontWeight: typographyTokens.fontWeight,
    lineHeight: typographyTokens.lineHeight,
    letterSpacing: typographyTokens.letterSpacing,
    
    extend: {
      // CSS custom properties ile entegrasyon
      backgroundColor: {
        'primary': 'rgb(var(--color-bg-primary) / <alpha-value>)',
        'secondary': 'rgb(var(--color-bg-secondary) / <alpha-value>)',
        'tertiary': 'rgb(var(--color-bg-tertiary) / <alpha-value>)',
        'elevated': 'rgb(var(--color-bg-elevated) / <alpha-value>)',
      },
      textColor: {
        'primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        'disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
        'inverse': 'rgb(var(--color-text-inverse) / <alpha-value>)',
      },
      borderColor: {
        'primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
        'secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        'focus': 'rgb(var(--color-border-focus) / <alpha-value>)',
        'error': 'rgb(var(--color-border-error) / <alpha-value>)',
        'success': 'rgb(var(--color-border-success) / <alpha-value>)',
      },
      
      // Brand colors
      colors: {
        brand: {
          primary: 'rgb(var(--color-brand-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--color-brand-primary-hover) / <alpha-value>)',
          'primary-active': 'rgb(var(--color-brand-primary-active) / <alpha-value>)',
          secondary: 'rgb(var(--color-brand-secondary) / <alpha-value>)',
          'secondary-hover': 'rgb(var(--color-brand-secondary-hover) / <alpha-value>)',
          accent: 'rgb(var(--color-brand-accent) / <alpha-value>)',
          'accent-hover': 'rgb(var(--color-brand-accent-hover) / <alpha-value>)',
        },
        state: {
          success: 'rgb(var(--color-state-success) / <alpha-value>)',
          'success-bg': 'rgb(var(--color-state-success-bg) / <alpha-value>)',
          'success-border': 'rgb(var(--color-state-success-border) / <alpha-value>)',
          warning: 'rgb(var(--color-state-warning) / <alpha-value>)',
          'warning-bg': 'rgb(var(--color-state-warning-bg) / <alpha-value>)',
          'warning-border': 'rgb(var(--color-state-warning-border) / <alpha-value>)',
          error: 'rgb(var(--color-state-error) / <alpha-value>)',
          'error-bg': 'rgb(var(--color-state-error-bg) / <alpha-value>)',
          'error-border': 'rgb(var(--color-state-error-border) / <alpha-value>)',
          info: 'rgb(var(--color-state-info) / <alpha-value>)',
          'info-bg': 'rgb(var(--color-state-info-bg) / <alpha-value>)',
          'info-border': 'rgb(var(--color-state-info-border) / <alpha-value>)',
        },
        interactive: {
          hover: 'rgb(var(--color-interactive-hover) / <alpha-value>)',
          active: 'rgb(var(--color-interactive-active) / <alpha-value>)',
          disabled: 'rgb(var(--color-interactive-disabled) / <alpha-value>)',
          selected: 'rgb(var(--color-interactive-selected) / <alpha-value>)',
        },
      },
      
      // Box shadows
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      
      // Z-index values
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
      
      // Animation durations
      transitionDuration: {
        'fastest': '50ms',
        'faster': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
        'slowest': '1000ms',
      },
      
      // Animation timing functions
      transitionTimingFunction: {
        'ease-in-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Responsive breakpoints
      screens: {
        'xs': '0px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
  ],
};

export default config;
