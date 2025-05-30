'use client';

import React from 'react';
import ThemeSettings from '@/components/settings/ThemeSettings';
import { motion } from 'framer-motion';

const ThemeSettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface-primary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8"
      >
        <ThemeSettings />
      </motion.div>
    </div>
  );
};

export default ThemeSettingsPage;
