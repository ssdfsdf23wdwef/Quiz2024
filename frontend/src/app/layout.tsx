import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import ClientAnalytics from "../components/analytics/ClientAnalytics";
import MainLayout from "@/components/layout/MainLayout";

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
        <style>{`
          /* Sidebar'ın görünürlüğü için özel stil */
          @media (min-width: 0px) {
            .sidebar-visible {
              display: block !important;
              visibility: visible !important;
            }
          }
        `}</style>
      </head>
      <body className={cn("min-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased", fontSans.className)}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
          <ClientAnalytics />
        </Providers>
      </body>
    </html>
  );
}
