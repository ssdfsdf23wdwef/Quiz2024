"use client";

import React, { ReactNode, memo, useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Lazy load components with loading priority
const Header = dynamic(() => import("@/components/layout/Header").then(mod => mod.Header), { 
  ssr: false, 
  loading: () => <LoadingPlaceholder /> 
});

const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { 
  ssr: false, 
  loading: () => <LoadingPlaceholder /> 
});

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  // useTheme hook'undan isDarkMode değişkenini al
  const { isDarkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);

  // Hydration mismatch sorunlarını önlemek için client tarafı render kontrolü
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"></div>;
  }

  return (
    <DevLoggerProvider>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode 
            ? "bg-gray-900 text-white" 
            : "bg-gray-50 text-gray-900"
        }`}
      >
        <Header />

        <div className="flex w-full">
          {/* Sidebar her zaman görünür */}
          <div className="fixed top-0 left-0 h-full z-30">
            <Sidebar />
          </div>

          {/* Ana içerik - sidebar'a göre kenarlık ayarı */}
          <main className="flex-1 w-full ml-64 pt-[70px] px-4 py-6 transition-colors duration-200">
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
