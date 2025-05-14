'use client';

import React, { useEffect } from "react";
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { setupGlobalErrorHandling } from '@/lib/logger.utils';
import MainLayout from "@/components/layout/MainLayout";
import ClientAnalytics from "@/components/analytics/ClientAnalytics";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupGlobalErrorHandling();
    console.log('%c📊 Uygulama başlatıldı ve hata izleme aktif edildi', 'color:#4CAF50; font-size:12px; font-weight:bold');
  }, []);

  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <MainLayout>
          {children}
        </MainLayout>
        <ClientAnalytics />
        <Toaster
          position="bottom-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </NextThemesProvider>
    </NextUIProvider>
  );
} 