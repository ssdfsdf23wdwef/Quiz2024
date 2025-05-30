// Modern typography scale optimized for readability and accessibility
export const typography = {
  // Font families - Modern web font stack
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'SF Mono',
      'Monaco',
      'Inconsolata',
      'Roboto Mono',
      'Fira Code',
      'Consolas',
      'monospace',
    ],
    display: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'sans-serif',
    ],
  },

  // Font sizes - Fluid and responsive scale
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],       // 72px
    '8xl': ['6rem', { lineHeight: '1' }],         // 96px
    '9xl': ['8rem', { lineHeight: '1' }],         // 128px
  },

  // Font weights - Comprehensive weight scale
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights - Optimized for readability
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter spacing - Subtle adjustments for better readability
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text styles for semantic usage across the platform
  textStyles: {
    // Display text - Hero sections and major headings
    'display-2xl': {
      fontSize: '4.5rem',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      fontFamily: 'display',
    },
    'display-xl': {
      fontSize: '3.75rem',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      fontFamily: 'display',
    },
    'display-lg': {
      fontSize: '3rem',
      fontWeight: '700',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      fontFamily: 'display',
    },
    'display-md': {
      fontSize: '2.25rem',
      fontWeight: '700',
      lineHeight: '2.5rem',
      letterSpacing: '-0.025em',
      fontFamily: 'display',
    },
    'display-sm': {
      fontSize: '1.875rem',
      fontWeight: '600',
      lineHeight: '2.25rem',
      fontFamily: 'display',
    },
    'display-xs': {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '2rem',
      fontFamily: 'display',
    },

    // Text content - Articles, descriptions, body text
    'text-xl': {
      fontSize: '1.25rem',
      fontWeight: '400',
      lineHeight: '1.75rem',
    },
    'text-lg': {
      fontSize: '1.125rem',
      fontWeight: '400',
      lineHeight: '1.75rem',
    },
    'text-md': {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
    },
    'text-sm': {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
    },
    'text-xs': {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
    },

    // UI elements - Buttons, labels, captions
    'label-lg': {
      fontSize: '1rem',
      fontWeight: '500',
      lineHeight: '1.5rem',
    },
    'label-md': {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
    },
    'label-sm': {
      fontSize: '0.75rem',
      fontWeight: '500',
      lineHeight: '1rem',
      letterSpacing: '0.025em',
    },

    // Code and monospace text
    'code-lg': {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
      fontFamily: 'mono',
    },
    'code-md': {
      fontSize: '0.875rem',
      fontWeight: '400',
      lineHeight: '1.25rem',
      fontFamily: 'mono',
    },
    'code-sm': {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
      fontFamily: 'mono',
    },

    // Legacy aliases for backward compatibility
    h1: {
      fontSize: '2.25rem',
      fontWeight: '700',
      lineHeight: '2.5rem',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: '600',
      lineHeight: '2.25rem',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: '600',
      lineHeight: '2rem',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.75rem',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: '600',
      lineHeight: '1.5rem',
    },
    body: {
      fontSize: '1rem',
      fontWeight: '400',
      lineHeight: '1.5rem',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: '400',
      lineHeight: '1rem',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      letterSpacing: '0.025em',
    },
  },
} as const;

export type Typography = typeof typography;
export type TextStyle = keyof typeof typography.textStyles;
