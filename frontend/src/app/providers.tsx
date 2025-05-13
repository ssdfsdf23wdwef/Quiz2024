"use client";

import React, { ReactNode, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/i18n";
import dynamic from "next/dynamic";
import { getLogger } from "@/lib/logger.utils";

// Loglama için
const logger = getLogger();

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
 * Hata yakalama işleyicisi
 */
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  logger.error(
    `App çapında hata: ${error.message}`,
    'Providers',
    'providers.tsx',
    42,
    {
      errorName: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    }
  );
  
  // Console'a da yazdır
  console.error("Uygulama seviyesinde bir hata oluştu:", error);
  console.error("Bileşen yığını:", errorInfo.componentStack);
};

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
    
    // Yakalanamayan hataları dinle
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        `Yakalanmayan Promise reddi: ${event.reason}`,
        'Providers',
        'providers.tsx',
        70,
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
        'providers.tsx',
        80,
        { 
          errorName: event.error?.name,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };
    
    // Event listener'ları ekle
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);
    
    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <ErrorBoundary 
      context="RootErrorBoundary"
      enableStackTrace={true}
      captureComponentTree={true}
      onError={handleError}
    >
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
