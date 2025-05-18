'use client';

import React, { useEffect } from 'react';
import { configureLogging } from '@/lib/setup-logging';

/**
 * Log sistemini yapılandıran bir istemci bileşeni
 * Bu bileşen use client direktifiyle işaretlenmiştir ve
 * uygulama yüklenirken log sistemini yapılandırır
 */
export default function ClientLogSetup({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Uygulama başladığında logging sistemini yapılandır
    try {
      const logger = configureLogging();
      console.log('Frontend log sistemi başlatıldı');
      
      // Başlangıç logları
      logger?.info('Uygulama başlatıldı', 'ClientLogSetup');
      
      // Global hata yakalayıcıları ekle
      window.onerror = (message, source, line, column, error) => {
        logger?.error(`Global hata: ${message}`, 'Window.onerror', { 
          source, line, column, stack: error?.stack 
        });
        // Normal işleyicinin çalışmasına izin ver
        return false;
      };
    } catch (error) {
      console.error('Log sistemi başlatma hatası:', error);
    }
  }, []);

  return <>{children}</>;
} 