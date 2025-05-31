"use client";

import { ReactNode, memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";
import UserControls from "./UserControls";
import { FiMenu, FiChevronRight } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";

const LoadingPlaceholder = () => (
  <div className="animate-pulse h-full">
    <div className="h-full w-64 bg-gray-100 dark:bg-gray-800 bg-opacity-60 dark:bg-opacity-60 border-r border-gray-200 dark:border-gray-800 rounded-r-md"></div> 
  </div>
);

const Sidebar = dynamic<SidebarProps>(
  () => import("@/components/layout/Sidebar"),
  { 
    loading: () => <LoadingPlaceholder />,
    ssr: false
  }
);

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  useEffect(() => {
    if (isHomePage) {
      document.body.classList.add('no-scroll');
      return () => {
        document.body.classList.remove('no-scroll');
      };
    }
  }, [isHomePage]);

  const layoutStructure = (
    <DevLoggerProvider>
      <div className="min-h-screen bg-primary text-primary transition-all duration-300 ease-in-out">
        <div className="flex w-full relative">
          {isMounted && (
            <div 
              className={`fixed top-0 left-0 h-full z-docked transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? 'w-16' : 'w-64'
              }`}
            >
              <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
              
              {/* Toggle Sidebar Button - Positioned in top-right of sidebar */}
  
            </div>
          )}

          <main 
            className={`flex-1 w-full min-h-screen transition-all duration-300 ease-in-out ${
              isMounted ? (isSidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
            }`}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              position: 'relative',
            }}
          >


            {/* User Controls - Only on Home Page */}
            {isHomePage && (
              <div className="fixed top-4 right-6 z-40">
                <UserControls />
              </div>
            )}
            <div className="max-w-7xl mx-auto w-full pt-2">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DevLoggerProvider>
  );

  return layoutStructure;
}


const MainLayout = memo(MainLayoutBase);
export default MainLayout;
