'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { 
  FiSun, 
  FiMoon, 
  FiMonitor, 
  FiType, 
  FiEye, 
  FiZap,
  FiRefreshCw,
  FiCheck 
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const ThemeSettings: React.FC = () => {
  const {
    theme,
    currentMode,
    isDarkMode,
    isSystemTheme,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    resetTheme,
  } = useTheme();

  const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto p-6 space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeInVariants} className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Theme Settings
        </h1>
        <p className="text-text-secondary">
          Customize your visual experience and accessibility preferences
        </p>
      </motion.div>

      {/* Current Theme Status */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <div className="flex items-center gap-3 mb-4">
          {isDarkMode ? (
            <FiMoon className="text-xl text-blue-500" />
          ) : (
            <FiSun className="text-xl text-yellow-500" />
          )}
          <div>
            <h3 className="font-semibold text-text-primary">
              Current Theme: {currentMode}
            </h3>
            <p className="text-sm text-text-secondary">
              {isSystemTheme 
                ? 'Following system preference' 
                : `Manually set to ${theme.mode}`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Theme Mode Selection */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FiMonitor className="text-blue-500" />
          Theme Mode
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${theme.mode === mode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-border-primary hover:border-blue-300 hover:bg-surface-tertiary'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {mode === 'light' && <FiSun className="text-xl text-yellow-500" />}
                {mode === 'dark' && <FiMoon className="text-xl text-blue-400" />}
                {mode === 'system' && <FiMonitor className="text-xl text-gray-500" />}
                
                <span className="text-sm font-medium text-text-primary capitalize">
                  {mode}
                </span>
                
                {theme.mode === mode && (
                  <FiCheck className="text-blue-500 absolute top-2 right-2" />
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiRefreshCw />
          Quick Toggle
        </button>
      </motion.div>

      {/* Font Size Settings */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FiType className="text-green-500" />
          Font Size
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${theme.fontSize === size
                  ? 'border-green-500 bg-green-50 dark:bg-green-950'
                  : 'border-border-primary hover:border-green-300 hover:bg-surface-tertiary'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`
                  ${size === 'small' && 'text-sm'}
                  ${size === 'medium' && 'text-base'}
                  ${size === 'large' && 'text-lg'}
                  font-medium text-text-primary
                `}>
                  Aa
                </div>
                
                <span className="text-sm font-medium text-text-primary capitalize">
                  {size}
                </span>
                
                {theme.fontSize === size && (
                  <FiCheck className="text-green-500 absolute top-2 right-2" />
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-surface-tertiary rounded-lg">
          <p className="text-text-secondary text-sm">
            Preview: This text will change size based on your selection.
          </p>
        </div>
      </motion.div>

      {/* Accessibility Settings */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FiEye className="text-purple-500" />
          Accessibility
        </h3>
        
        <div className="space-y-4">
          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-4 bg-surface-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <FiZap className={`text-xl ${theme.reducedMotion ? 'text-orange-500' : 'text-gray-400'}`} />
              <div>
                <h4 className="font-medium text-text-primary">Reduced Motion</h4>
                <p className="text-sm text-text-secondary">
                  Minimize animations and transitions
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleReducedMotion}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${theme.reducedMotion ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${theme.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-4 bg-surface-tertiary rounded-lg">
            <div className="flex items-center gap-3">
              <FiEye className={`text-xl ${theme.highContrast ? 'text-purple-500' : 'text-gray-400'}`} />
              <div>
                <h4 className="font-medium text-text-primary">High Contrast</h4>
                <p className="text-sm text-text-secondary">
                  Increase contrast for better visibility
                </p>
              </div>
            </div>
            
            <button
              onClick={toggleHighContrast}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${theme.highContrast ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <div
                className={`
                  absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                  ${theme.highContrast ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reset Settings */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Reset Settings
        </h3>
        
        <p className="text-text-secondary mb-4">
          Reset all theme and accessibility settings to their default values.
        </p>
        
        <button
          onClick={resetTheme}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <FiRefreshCw />
          Reset to Defaults
        </button>
      </motion.div>

      {/* Current Settings Summary */}
      <motion.div
        variants={fadeInVariants}
        className="bg-surface-secondary rounded-xl p-6 border border-border-primary"
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Current Settings
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-secondary">Theme Mode:</span>
            <span className="text-text-primary font-medium ml-2 capitalize">
              {theme.mode}
            </span>
          </div>
          
          <div>
            <span className="text-text-secondary">Active Theme:</span>
            <span className="text-text-primary font-medium ml-2 capitalize">
              {currentMode}
            </span>
          </div>
          
          <div>
            <span className="text-text-secondary">Font Size:</span>
            <span className="text-text-primary font-medium ml-2 capitalize">
              {theme.fontSize}
            </span>
          </div>
          
          <div>
            <span className="text-text-secondary">Reduced Motion:</span>
            <span className="text-text-primary font-medium ml-2">
              {theme.reducedMotion ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div>
            <span className="text-text-secondary">High Contrast:</span>
            <span className="text-text-primary font-medium ml-2">
              {theme.highContrast ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div>
            <span className="text-text-secondary">System Theme:</span>
            <span className="text-text-primary font-medium ml-2">
              {isSystemTheme ? 'Following' : 'Override'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ThemeSettings;
