// Modern spacing scale optimized for mobile and desktop
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  18: '4.5rem',     // 72px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Modern border radius values for smooth, accessible design
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px - Small elements
  base: '0.375rem', // 6px - Default buttons, inputs
  md: '0.5rem',     // 8px - Cards, containers
  lg: '0.75rem',    // 12px - Larger cards
  xl: '1rem',       // 16px - Prominent elements
  '2xl': '1.25rem', // 20px - Hero sections
  '3xl': '1.5rem',  // 24px - Large containers
  full: '9999px',   // Fully rounded
} as const;

// Z-index scale
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Responsive breakpoints optimized for modern devices
export const breakpoints = {
  xs: '0px',       // Mobile first
  sm: '640px',     // Large mobile / small tablet
  md: '768px',     // Tablet
  lg: '1024px',    // Small desktop / large tablet
  xl: '1280px',    // Desktop
  '2xl': '1536px', // Large desktop
  '3xl': '1920px', // Extra large screens
} as const;

// Component sizes optimized for touch and accessibility
export const sizes = {
  // Button sizes - Touch-friendly with proper tap targets
  button: {
    xs: {
      height: '1.75rem',   // 28px - minimum touch target
      paddingX: '0.75rem', // 12px
      fontSize: '0.75rem',
      minWidth: '2.5rem',  // 40px minimum
    },
    sm: {
      height: '2.25rem',   // 36px
      paddingX: '1rem',    // 16px
      fontSize: '0.875rem',
      minWidth: '3rem',    // 48px minimum
    },
    md: {
      height: '2.75rem',   // 44px - optimal touch target
      paddingX: '1.25rem', // 20px
      fontSize: '0.875rem',
      minWidth: '3.5rem',  // 56px minimum
    },
    lg: {
      height: '3.25rem',   // 52px
      paddingX: '1.75rem', // 28px
      fontSize: '1rem',
      minWidth: '4rem',    // 64px minimum
    },
    xl: {
      height: '3.75rem',   // 60px
      paddingX: '2.25rem', // 36px
      fontSize: '1.125rem',
      minWidth: '5rem',    // 80px minimum
    },
  },

  // Input sizes - Consistent with buttons for better UX
  input: {
    sm: {
      height: '2.25rem',   // 36px
      paddingX: '0.875rem', // 14px
      fontSize: '0.875rem',
    },
    md: {
      height: '2.75rem',   // 44px - optimal for mobile
      paddingX: '1rem',    // 16px
      fontSize: '1rem',
    },
    lg: {
      height: '3.25rem',   // 52px
      paddingX: '1.25rem', // 20px
      fontSize: '1.125rem',
    },
  },

  // Avatar sizes - Scalable for different contexts
  avatar: {
    xs: '1.5rem',   // 24px
    sm: '2rem',     // 32px
    md: '2.5rem',   // 40px
    lg: '3rem',     // 48px
    xl: '4rem',     // 64px
    '2xl': '5rem',  // 80px
    '3xl': '6rem',  // 96px
  },

  // Icon sizes - Consistent scaling
  icon: {
    xs: '0.875rem', // 14px
    sm: '1rem',     // 16px
    md: '1.25rem',  // 20px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',  // 48px
  },

  // Container sizes for responsive design
  container: {
    xs: '20rem',    // 320px
    sm: '24rem',    // 384px
    md: '28rem',    // 448px
    lg: '32rem',    // 512px
    xl: '36rem',    // 576px
    '2xl': '42rem', // 672px
    '3xl': '48rem', // 768px
    '4xl': '56rem', // 896px
    '5xl': '64rem', // 1024px
    '6xl': '72rem', // 1152px
    '7xl': '80rem', // 1280px
  },
} as const;

// Animation durations optimized for smooth interactions
export const duration = {
  instant: '0ms',
  fastest: '75ms',   // Micro-interactions
  faster: '100ms',   // Hover states
  fast: '150ms',     // Button presses
  normal: '200ms',   // Standard transitions
  slow: '300ms',     // Modal appearances
  slower: '500ms',   // Page transitions
  slowest: '750ms',  // Complex animations
  'extra-slow': '1000ms', // Loading states
} as const;

// Modern easing functions for natural motion
export const easing = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  // Custom easing for modern feel
  'ease-in-sine': 'cubic-bezier(0.12, 0, 0.39, 0)',
  'ease-out-sine': 'cubic-bezier(0.61, 1, 0.88, 1)',
  'ease-in-out-sine': 'cubic-bezier(0.37, 0, 0.63, 1)',
  'ease-in-quad': 'cubic-bezier(0.11, 0, 0.5, 0)',
  'ease-out-quad': 'cubic-bezier(0.5, 1, 0.89, 1)',
  'ease-in-out-quad': 'cubic-bezier(0.45, 0, 0.55, 1)',
  'ease-in-cubic': 'cubic-bezier(0.32, 0, 0.67, 0)',
  'ease-out-cubic': 'cubic-bezier(0.33, 1, 0.68, 1)',
  'ease-in-out-cubic': 'cubic-bezier(0.65, 0, 0.35, 1)',
  // Spring-like easing
  'ease-in-back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  // Bouncy easing
  'ease-out-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Smooth and professional
  'ease-smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'ease-snappy': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type ButtonSize = keyof typeof sizes.button;
export type InputSize = keyof typeof sizes.input;
export type AvatarSize = keyof typeof sizes.avatar;
export type IconSize = keyof typeof sizes.icon;
export type ContainerSize = keyof typeof sizes.container;
