import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import "@/styles/globals.css";
import { Providers } from "@/app/providers";
import ClientLayout from "@/components/layout/ClientLayout";
import ClientLogSetup from "@/components/layout/ClientLogSetup";

const fontSans = FontSans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "quiz - Akıllı Sınav Hazırlama ve Öğrenme Platformu",
  description: "Kişiselleştirilmiş sınavlarla öğrenmenizi geliştirin",
  applicationName: "quiz",
  authors: [{ name: "quiz Team" }],
  keywords: [
    "eğitim",
    "sınav",
    "öğrenme",
    "yapay zeka",
    "kişiselleştirilmiş öğrenme",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Uygulamanın kök layout bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="icon" href="/frontend/public/favicon.webp" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
<<<<<<< HEAD
      <body className={cn("min-h-screen bg-primary text-primary font-sans antialiased", fontSans.className)}>
        <ClientLogSetup>
=======
      <body className={cn(
        "min-h-screen font-sans antialiased",
        "bg-light-background dark:bg-dark-bg-primary",
        "text-light-text-primary dark:text-dark-text-primary",
        fontSans.className
      )}>
>>>>>>> origin/en-yeni
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
        </ClientLogSetup>
      </body>
    </html>
  );
}
