/**
 * Design variables/tokens for the application
 * These are the base design values that will be used across themes
 */

// Spacing scale (in rem units)
export const spacing = {
  '0': '0',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
} as const;

// Border radius scale
export const borderRadius = {
  'none': '0',
  'sm': '0.125rem',
  'DEFAULT': '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  'full': '9999px',
} as const;

// Font weight
export const fontWeight = {
  'thin': '100',
  'extralight': '200',
  'light': '300',
  'normal': '400',
  'medium': '500',
  'semibold': '600',
  'bold': '700',
  'extrabold': '800',
  'black': '900',
} as const;

// Font size (with matching line heights)
export const fontSize = {
  'xs': {
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  'sm': {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  'base': {
    fontSize: '1rem',
    lineHeight: '1.5rem',
  },
  'lg': {
    fontSize: '1.125rem',
    lineHeight: '1.75rem',
  },
  'xl': {
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
  },
  '2xl': {
    fontSize: '1.5rem',
    lineHeight: '2rem',
  },
  '3xl': {
    fontSize: '1.875rem',
    lineHeight: '2.25rem',
  },
  '4xl': {
    fontSize: '2.25rem',
    lineHeight: '2.5rem',
  },
  '5xl': {
    fontSize: '3rem',
    lineHeight: '1',
  },
  '6xl': {
    fontSize: '3.75rem',
    lineHeight: '1',
  },
  '7xl': {
    fontSize: '4.5rem',
    lineHeight: '1',
  },
  '8xl': {
    fontSize: '6rem',
    lineHeight: '1',
  },
  '9xl': {
    fontSize: '8rem',
    lineHeight: '1',
  },
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  'xs': '480px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
} as const;

// Z-index scale
export const zIndex = {
  'auto': 'auto',
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'dropdown': '1000',
  'sticky': '1100',
  'fixed': '1200',
  'modal': '1300',
  'popover': '1400',
  'tooltip': '1500',
} as const;

// Transition durations
export const transitionDuration = {
  'DEFAULT': '150ms',
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
} as const;

// Transition timing functions
export const transitionTimingFunction = {
  'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'linear': 'linear',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Typography - Font families
export const fontFamily = {
  'sans': [
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    '"Noto Sans"',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
    '"Noto Color Emoji"',
  ].join(','),
  'serif': [
    'ui-serif',
    'Georgia',
    'Cambria',
    '"Times New Roman"',
    'Times',
    'serif',
  ].join(','),
  'mono': [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ].join(','),
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type FontWeight = typeof fontWeight;
export type FontSize = typeof fontSize;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type TransitionDuration = typeof transitionDuration;
export type TransitionTimingFunction = typeof transitionTimingFunction;
export type FontFamily = typeof fontFamily;
