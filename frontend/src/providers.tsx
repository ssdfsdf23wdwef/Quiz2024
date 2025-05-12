/**
 * @file providers.tsx
 * @description Temel provider bileşeni - tüm uygulama servislerini başlatır ve yapılandırır
 */

'use client';

import { useMemo, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { getLogger } from "@/lib/logger.utils";
import LoggingInitializer from "@/components/providers/LoggingInitializer";

const logger = getLogger();

// İstemci tarafı kontrolü
const isBrowser = typeof window !== 'undefined';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Client tarafında yükleme kontrolü
  useEffect(() => {
    setIsMounted(true);
    if (isBrowser) {
      logger.debug(
        "Providers bileşeni client tarafında yüklendi", 
        "Providers", 
        "providers.tsx",
        19
      );
    }
  }, []);
  
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 dakika (daha uzun önbellekleme)
            gcTime: 10 * 60 * 1000, // 10 dakika (eski adıyla cacheTime)
            refetchOnWindowFocus: true,
            refetchOnMount: "always",
            retry: 1, // Başarısız istekleri sadece 1 kez yeniden dene
            networkMode: "online",
          },
          mutations: {
            networkMode: "online",
            retry: 1,
          },
        },
      }),
  );

  const toasterOptions = useMemo(() => ({
    position: "top-right" as const,
    toastOptions: {
      duration: 3000,
      style: {
        background: "#363636",
        color: "#fff",
      },
    }
  }), []);

  const isDevMode = useMemo(() => process.env.NODE_ENV === "development", []);
  
  // SSR sırasında sadece çocukları render et
  if (!isMounted) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {/* Önce loglama servislerini başlat */}
      <LoggingInitializer />
      
      <AuthProvider>
        <ThemeProvider>
          {children}
          <Toaster {...toasterOptions} />
        </ThemeProvider>
      </AuthProvider>
      
      {isDevMode && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
} 