"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // HTML'de class kullanarak temayı belirle
      defaultTheme="system" // Varsayılan olarak sistem teması
      enableSystem={true} // Sistem teması desteği
      disableTransitionOnChange={false} // Tema değişiminde geçiş efekti
      storageKey="theme-preference" // Local storage'da tema tercihini saklayacak anahtar
      themes={["light", "dark"]} // Desteklenen temalar
    >
      {children}
    </NextThemesProvider>
  );
}
