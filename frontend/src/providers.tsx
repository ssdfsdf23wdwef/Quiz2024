/**
 * @file providers.tsx
 * @description Temel provider bileşeni - tüm uygulama servislerini başlatır ve yapılandırır
 */

'use client';

import React, { ReactNode, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "./app/context/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n/i18n";
import dynamic from "next/dynamic";

// Dynamic imports for better performance - moved here
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