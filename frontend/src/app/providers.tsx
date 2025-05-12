"use client";

import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
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

  return (
    <QueryClientProvider client={queryClient}>
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
