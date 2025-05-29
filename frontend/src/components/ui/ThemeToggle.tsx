'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}        ${className}
        inline-flex items-center justify-center
        rounded-md
        bg-secondary
        text-primary 
        border border-primary
        hover:bg-interactive-hover
        focus:outline-none
        focus:ring-2
        focus:ring-border-focus
        focus:ring-offset-2
        shadow-sm
        transition-all duration-normal
        group
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative">
        {/* Sun icon - visible in dark mode */}
        <svg
          className={`
            ${iconSize[size]}
            absolute inset-0
            transform transition-all duration-normal
            ${theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
            }
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon icon - visible in light mode */}
        <svg
          className={`
            ${iconSize[size]}
            absolute inset-0
            transform transition-all duration-normal
            ${theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
            }
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>

      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'light' ? 'Koyu' : 'Açık'} Tema
        </span>
      )}
    </button>
  );
};
