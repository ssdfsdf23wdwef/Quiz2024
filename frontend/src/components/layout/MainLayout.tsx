"use client";

import React, { ReactNode, memo, useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeProvider";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-secondary border border-primary rounded-md"></div> 
  </div>
);

// Lazy load components with loading priority
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { 
  loading: () => <LoadingPlaceholder /> 
});

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const layoutStructure = (
    <DevLoggerProvider>
      <div className="min-h-screen bg-primary text-primary transition-colors duration-normal">
        <div className="flex w-full relative">
          {isMounted && (
            <div className="fixed top-0 left-0 h-full z-docked w-64">
              <Sidebar />
            </div>
          )}

          <main 
            className={`flex-1 w-full min-h-screen transition-all duration-normal ${
              isMounted ? "ml-64" : "ml-0"
            }`}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingBottom: '1.5rem',
              marginLeft: isMounted ? '16rem' : '0',
            }}
          >
            <div className="max-w-7xl mx-auto w-full">{children}</div>
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
