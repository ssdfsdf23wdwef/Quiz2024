"use client";

import React, { useEffect } from "react";
import { setupLogging } from "@/lib/logger.utils";

/**
 * Tüm uygulama için global servisler ve sağlayıcıları ayarlar
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Uygulama başlangıcında loglama servisleri başlatılır
  useEffect(() => {
    const { logger, flowTracker } = setupLogging();
    
    // Üretim ortamına göre ayarları belirle
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Logger Servisi ayarları
    logger.configure({
      minLevel: isProduction ? 'warn' : 'debug',
      enableConsole: true,
      enableRemote: isProduction,
      remoteUrl: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
      enableStackTrace: !isProduction
    });
    
    // FlowTracker ayarları
    flowTracker.configure({
      enabled: true,
      consoleOutput: !isProduction,
      traceRenders: !isProduction,
      traceStateChanges: true,
      traceApiCalls: true
    });
    
    // Uygulama başlangıç bilgilerini logla
    logger.info(
      'Uygulama başlatıldı',
      'App',
      'Providers.tsx',
      33,
      {
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      }
    );
    
    // Tarayıcı ve sistem bilgilerini izle
    if (typeof window !== 'undefined') {
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        dpr: window.devicePixelRatio
      };
      
      logger.debug(
        'Tarayıcı bilgileri',
        'App',
        'Providers.tsx',
        52,
        { browser: browserInfo }
      );
      
      // Performans ölçümleri izle
      if (window.performance) {
        try {
          // Performance API'nin memory özelliği için tiplemesi
          interface PerformanceMemory {
            jsHeapSizeLimit: number;
            totalJSHeapSize: number;
            usedJSHeapSize: number;
          }
          
          const performanceWithMemory = window.performance as unknown as {
            memory?: PerformanceMemory
          };
          
          const performanceMetrics = {
            navigation: window.performance.getEntriesByType('navigation'),
            memory: performanceWithMemory.memory 
              ? {
                  jsHeapSizeLimit: performanceWithMemory.memory.jsHeapSizeLimit,
                  totalJSHeapSize: performanceWithMemory.memory.totalJSHeapSize,
                  usedJSHeapSize: performanceWithMemory.memory.usedJSHeapSize
                }
              : 'not available'
          };
          
          logger.debug(
            'Performans metrikleri',
            'App',
            'Providers.tsx',
            80,
            { performance: performanceMetrics }
          );
        } catch (error) {
          // Bazı tarayıcılarda performance API erişimi kısıtlı olabilir
          logger.debug(
            'Performans metrikleri erişilemedi',
            'App',
            'Providers.tsx',
            88,
            { error }
          );
        }
      }
      
      // Çevrimiçi durum değişikliklerini izle
      window.addEventListener('online', () => {
        logger.info('Çevrimiçi duruma geçildi', 'App', 'Providers.tsx', 96);
        flowTracker.trackStep('Navigation', 'Kullanıcı çevrimiçi duruma geçti', 'App');
      });
      
      window.addEventListener('offline', () => {
        logger.warn('Çevrimdışı duruma geçildi', 'App', 'Providers.tsx', 101);
        flowTracker.trackStep('Navigation', 'Kullanıcı çevrimdışı duruma geçti', 'App');
      });
      
      // Görünürlük değişikliklerini izle
      document.addEventListener('visibilitychange', () => {
        const isVisible = document.visibilityState === 'visible';
        logger.debug(
          `Sayfa ${isVisible ? 'görünür' : 'gizli'} duruma geçti`,
          'App',
          'Providers.tsx',
          109
        );
        
        flowTracker.trackStep(
          'Navigation',
          `Sayfa ${isVisible ? 'görünür' : 'gizli'} duruma geçti`,
          'App'
        );
      });
    }
    
    // Temizleme işlemi
    return () => {
      logger.info('Uygulama kapatılıyor', 'App', 'Providers.tsx', 122);
    };
  }, []);
  
  return <>{children}</>;
}

export default Providers; 