"use client";

import React, { ReactNode, useEffect } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/i18n";
import dynamic from "next/dynamic";
import { setupLogging, setupGlobalErrorHandling, startFlow } from "@/lib/logger.utils";
import { FlowCategory } from "@/constants/logging.constants";
import { LogLevel } from "@/services/logger.service";

// Loglama ve akış izleme servislerini başlat
const { logger } = setupLogging({
  loggerOptions: {
    level: LogLevel.INFO,
    enabled: true,
    consoleOutput: false,
    sendLogsToApi: true,
  },
  flowTrackerOptions: {
    enabled: true,
    traceApiCalls: true,
    traceStateChanges: true,
    captureTimings: true,
    consoleOutput: false,
    sendLogsToApi: true,
  }
});

// Dynamic imports for better performance
const AnalyticsComponent = dynamic(
  () => import("@/components/analytics/AnalyticsComponent"),
  {
    ssr: false,
    loading: () => <></>, // Or a minimal skeleton/null
  },
);

// QueryClient oluştur
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      retry: 1,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}


/**
 * Tüm uygulama sağlayıcılarını (providers) bir araya getiren bileşen
 * Bu bileşen, RootLayout içerisinde tüm uygulamayı sarmalar
 */
export function Providers({ children }: ProvidersProps) {
  // Tarayıcıda çalıştığında i18n'i başlat (SSR'daki uyumsuzluklardan kaçınmak için)
  useEffect(() => {
    // i18next'in hazır olduğundan emin ol
    if (!i18n.isInitialized) {
      i18n.init();
    }
    
    // Uygulama başladı flowunu izle
    const appFlow = startFlow(FlowCategory.Navigation, 'AppStartup');
    appFlow.trackStep('Uygulama başlangıç bileşenleri yüklendi');
    
    // Global hata yakalama
    setupGlobalErrorHandling();
    
    // Yakalanamayan hataları dinle
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        `Yakalanmayan Promise reddi: ${event.reason}`,
        'Providers',
        event.reason instanceof Error ? event.reason : undefined,
        event.reason instanceof Error ? event.reason.stack : undefined,
        { 
          reason: event.reason?.toString(), 
          stack: event.reason?.stack 
        }
      );
    };

    const handleGlobalError = (event: ErrorEvent) => {
      logger.error(
        `Yakalanmayan global hata: ${event.message}`,
        'Providers',
        event.error,
        event.error?.stack,
        { 
          errorName: event.error?.name,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };
    
    // Event listener'ları ekle
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    
    // Sayfanın önbelleğe alınması, görüntülenmesi ve yüklenme olaylarını izle
    const pageLoadFlow = startFlow(FlowCategory.Navigation, 'PageLoad');
    
    // Sayfa yükleme adımlarını kaydet
    if (document.readyState === 'loading') {
      pageLoadFlow.trackStep('Sayfa yükleniyor');
      document.addEventListener('DOMContentLoaded', () => {
        pageLoadFlow.trackStep('DOM yüklendi');
      });
    } else {
      pageLoadFlow.trackStep('DOM zaten yüklü');
    }
    
    window.addEventListener('load', () => {
      pageLoadFlow.trackStep('Sayfa tamamen yüklendi');
      pageLoadFlow.end('Sayfa yükleme tamamlandı');
      appFlow.trackStep('Uygulama tamamen yüklendi');
      appFlow.end();
    });
    
    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ToastProvider>
                {children}
                <AnalyticsComponent />
              </ToastProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
