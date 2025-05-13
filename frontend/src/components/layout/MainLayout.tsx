"use client";

import React, { ReactNode, Suspense, memo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";

// Lazy load components - Next.js dynamic import kullanarak
const Header = dynamic(() => import("@/components/layout/Header").then(mod => mod.Header), { ssr: false });
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { ssr: false });

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  // useTheme hook'undan isDarkMode değişkenini al
  const { isDarkMode } = useTheme();

  return (
    <DevLoggerProvider>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode 
            ? "bg-gray-900 text-white" 
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <Suspense fallback={<LoadingPlaceholder />}>
          <Header />
        </Suspense>
        <div className="flex">
          {/* Sidebar sadece lg ve üstü ekran boyutlarında görünür */}
          <Suspense fallback={<LoadingPlaceholder />}>
            <Sidebar />
          </Suspense>

          {/* Ana içerik - mobil cihazlar için kenar boşluğunu ayarla */}
          <main className="w-full lg:ml-64 pt-[70px] px-4 py-6 lg:p-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </DevLoggerProvider>
  );
}

// Memoize the layout to prevent unnecessary rerenders
const MainLayout = memo(MainLayoutBase);
export default MainLayout;
