"use client";

import React, { ReactNode, memo, useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    {/* Adjusted placeholder to better match potential header/sidebar structure */}
    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div> 
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
  const { isDarkMode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const layoutStructure = (
    <DevLoggerProvider>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isMounted && isDarkMode 
            ? "bg-slate-900 text-slate-100" // Dark mode: slate background, light text
            : "bg-gradient-to-br from-slate-50 to-sky-100 text-slate-800" // Light mode: gradient, dark text
        }`}
      >
        {/* Header is rendered only on client-side after mount to ensure theme consistency */}
        {isMounted && <Header />}

        <div className="flex w-full">
          {isMounted && (
            <div className="fixed top-0 left-0 h-full z-30 pt-16"> {/* Added pt-16 to account for header height */}
              <Sidebar />
            </div>
          )}

          <main className={`flex-1 w-full ${isMounted ? "ml-64" : "ml-0"} pt-[64px] px-4 py-6 transition-all duration-300`}> {/* Adjusted pt for header, ml transition */}
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
