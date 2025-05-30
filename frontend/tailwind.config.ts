import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";
import { colors, spacing, borderRadius, typography as typographyTokens, breakpoints, duration, easing } from "./src/styles";

const config: Config = {
  // Dark theme support with class and system preference
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
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
  ],
};

export default config;
