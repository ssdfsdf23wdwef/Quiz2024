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
  loading: () => <LoadingPlaceholder /> 
});

const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { 
  loading: () => <LoadingPlaceholder /> 
});

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  // useTheme hook'undan isDarkMode değişkenini al
  const { isDarkMode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  // Hydration mismatch sorunlarını önlemek için client tarafı render kontrolü
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Temel layout yapısı - sonradan içerik doldurulacak
  const layoutStructure = (
    <DevLoggerProvider>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isMounted && isDarkMode 
            ? "bg-gray-900 text-white" 
            : "bg-gray-50 text-gray-900"
        }`}
      >
        {isMounted && <Header />}

        <div className="flex w-full">
          {/* Sidebar sadece client tarafında render edilir */}
          {isMounted && (
            <div className="fixed top-0 left-0 h-full z-30">
              <Sidebar />
            </div>
          )}

          {/* Ana içerik - sidebar'a göre kenarlık ayarı */}
          <main className={`flex-1 w-full ${isMounted ? "ml-64" : ""} pt-[70px] px-4 py-6 transition-colors duration-200`}>
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </DevLoggerProvider>
  );

  return layoutStructure;
}

// Memoize the layout to prevent unnecessary rerenders
const MainLayout = memo(MainLayoutBase);
export default MainLayout;
