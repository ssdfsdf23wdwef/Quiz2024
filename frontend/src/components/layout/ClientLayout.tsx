'use client';

import React, { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getLogger, trackFlow } from '@/lib/logger.utils';
import { FlowCategory } from '@/constants/logging.constants';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider } from '@/context/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { setupGlobalErrorHandling } from '@/lib/logger.utils';
import MainLayout from "@/components/layout/MainLayout";
import ClientAnalytics from "@/components/analytics/ClientAnalytics";

// Loglayıcıyı al (providers.tsx'te başlatıldı)
const logger = getLogger();

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  // Sayfa değişimlerini izle
  useEffect(() => {
    // Sayfa değişimini logla
    logger.info(`Sayfa değişti: ${pathname}`, 'Navigation');
    
    // Sayfa değişim akışını başlat
    trackFlow(`Sayfaya gezinti: ${pathname}`, 'Navigation', FlowCategory.Navigation, {
      previousPath: window.history.state?.previousPath || '',
      currentPath: pathname
    });
    
    // Sayfa değişimini history state'e kaydet (bir sonraki değişim için)
    const previousPath = window.history.state?.previousPath;
    const newState = { ...window.history.state, previousPath: pathname };
    window.history.replaceState(newState, '', pathname);
    
    // Analytics için veri gönder
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
        previousPath
      });
    }
  }, [pathname]);

  return (
    <NextUIProvider>
      <ThemeProvider>
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
              background: 'rgb(var(--color-bg-elevated))',
              color: 'rgb(var(--color-text-primary))',
              border: '1px solid rgb(var(--color-border-primary))',
            },
          }}
        />
      </ThemeProvider>
    </NextUIProvider>
  );
} 