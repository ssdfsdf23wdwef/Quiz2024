"use client";

import React, { ReactNode, Suspense, memo } from "react";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";

// Lazy load components - Next.js dynamic import kullanarak
const Header = dynamic(() => import("@/components/layout/Header").then(mod => mod.Header), { ssr: false });
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-light-background-tertiary dark:bg-dark-bg-tertiary rounded"></div>
  </div>
);

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Ana düzen bileşeni
 * Yeni stil sistemine uygun olarak güncellenmiştir
 */
function MainLayoutBase({ children }: MainLayoutProps) {
  return (
    <DevLoggerProvider>
      <div
        className="min-h-screen flex flex-col transition-colors duration-200 
          bg-light-background dark:bg-dark-bg-primary 
          text-light-text-primary dark:text-dark-text-primary"
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <Header />
        </Suspense>
        <div className="flex flex-1">
          {/* Sidebar sadece lg ve üstü ekran boyutlarında görünür */}
          <Suspense fallback={<LoadingPlaceholder />}>
            <Sidebar />
          </Suspense>

          {/* Ana içerik - mobil cihazlar için kenar boşluğunu ayarla */}
          <main className="w-full lg:ml-64 pt-[70px] px-4 py-6 lg:p-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
        <Suspense fallback={<LoadingPlaceholder />}>
          <Footer />
        </Suspense>
      </div>
    </DevLoggerProvider>
  );
}

// Memoize the layout to prevent unnecessary rerenders
const MainLayout = memo(MainLayoutBase);
export default MainLayout;
