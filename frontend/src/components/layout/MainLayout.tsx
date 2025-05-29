"use client";

import { ReactNode, memo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DevLoggerProvider from "@/components/providers/DevLoggerProvider";
import UserControls from "./UserControls";
import { usePathname } from "next/navigation";

const LoadingPlaceholder = () => (
  <div className="animate-pulse">
    <div className="h-16 bg-secondary border border-primary rounded-md"></div> 
  </div>
);

const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { 
  loading: () => <LoadingPlaceholder /> 
});

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutBase({ children }: MainLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              marginLeft: isMounted ? '16rem' : '0',
              position: 'relative',
            }}
          >
            {/* User Controls - Only on Home Page */}
            {isHomePage && (
              <div className="fixed top-4 right-6 z-40">
                <UserControls />
              </div>
            )}
            <div className="max-w-7xl mx-auto w-full">
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
