"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { defaultThemePreferences } from "@/style";

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Uygulama genelinde tema desteği sağlayan Provider bileşeni
 * next-themes kütüphanesini kullanarak tema değişimini yönetir
 * ve yeni stil sistemini entegre eder
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // HTML'de class kullanarak temayı belirle
      defaultTheme={defaultThemePreferences.mode} // Varsayılan olarak sistem teması
      enableSystem={true} // Sistem teması desteği
      disableTransitionOnChange={false} // Tema değişiminde geçiş efekti
      storageKey="theme-preference" // Local storage'da tema tercihini saklayacak anahtar
      themes={["light", "dark"]} // Desteklenen temalar
    >
      {children}
    </NextThemesProvider>
  );
}
