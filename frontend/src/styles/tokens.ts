// Spacing scale based on 4px base unit
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

// Border radius values
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
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

// Breakpoints for responsive design
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component sizes
export const sizes = {
  // Button sizes
  button: {
    xs: {
      height: '1.5rem',   // 24px
      paddingX: '0.5rem', // 8px
      fontSize: '0.75rem',
    },
    sm: {
      height: '2rem',     // 32px
      paddingX: '0.75rem', // 12px
      fontSize: '0.875rem',
    },
    md: {
      height: '2.5rem',   // 40px
      paddingX: '1rem',   // 16px
      fontSize: '0.875rem',
    },
    lg: {
      height: '3rem',     // 48px
      paddingX: '1.5rem', // 24px
      fontSize: '1rem',
    },
    xl: {
      height: '3.5rem',   // 56px
      paddingX: '2rem',   // 32px
      fontSize: '1.125rem',
    },
  },

  // Input sizes
  input: {
    sm: {
      height: '2rem',     // 32px
      paddingX: '0.75rem', // 12px
      fontSize: '0.875rem',
    },
    md: {
      height: '2.5rem',   // 40px
      paddingX: '1rem',   // 16px
      fontSize: '1rem',
    },
    lg: {
      height: '3rem',     // 48px
      paddingX: '1rem',   // 16px
      fontSize: '1.125rem',
    },
  },

  // Avatar sizes
  avatar: {
    xs: '1.5rem',  // 24px
    sm: '2rem',    // 32px
    md: '2.5rem',  // 40px
    lg: '3rem',    // 48px
    xl: '4rem',    // 64px
    '2xl': '5rem', // 80px
  },

  // Icon sizes
  icon: {
    xs: '0.75rem', // 12px
    sm: '1rem',    // 16px
    md: '1.25rem', // 20px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
    '2xl': '2.5rem', // 40px
  },
} as const;

// Animation durations
export const duration = {
  fastest: '50ms',
  faster: '100ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
} as const;

// Animation easing functions
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeInBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
