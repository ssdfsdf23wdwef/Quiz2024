"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiTarget,
  FiSettings,
  FiBarChart2,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Eğer /auth/login sayfasındaysak, sidebar'ı render etme
  if (pathname === "/auth/login") {
    return null;
  }

  // Her zaman bu menü öğeleri gösterilecek
  const menuItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: <FiHome size={18} />,
    },
    { 
      href: "/courses", 
      label: "Derslerim", 
      icon: <FiBook size={18} /> 
    },
    {
      href: "/exams",
      label: "Sınavlarım",
      icon: <FiFileText size={18} />,
    },
    {
      href: "/learning-goals",
      label: "Öğrenme Hedeflerim",
      icon: <FiTarget size={18} />,
    },
    { 
      href: "/performance", 
      label: "Performans Analizi", 
      icon: <FiBarChart2 size={18} /> 
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div 
      className="fixed top-0 left-0 h-full w-64 z-30 border-r border-primary bg-secondary transition-colors duration-normal flex flex-col"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-border-secondary) var(--color-bg-secondary)'
      }}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-primary bg-secondary/50">
        <h2 className="text-lg font-semibold text-primary">Menü</h2>
      </div>
      <div className="flex-1 flex flex-col">
        {isInitializing ? (
          // Yükleme durumunda placeholder göster
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 bg-tertiary rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {/* Ana menü öğeleri */}
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => e.stopPropagation()}
                    className={`py-3 px-4 rounded-lg flex items-center transition-all duration-200 group ${
                      isActive(item.href)
                        ? "bg-brand-primary/10 text-brand-primary font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className={`${isActive(item.href) ? "text-brand-primary" : "text-gray-500 dark:text-gray-400"} mr-3 transition-colors group-hover:text-brand-primary`}>
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                    {isActive(item.href) && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-brand-primary"></span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Ayarlar butonu - En altta sabit */}
              <div className="border-t border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/50 to-blue-50/30 dark:from-gray-900/50 dark:to-blue-900/20 backdrop-blur-sm">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/settings"
                    onClick={(e) => e.stopPropagation()}
                    className={`group flex items-center py-4 px-6 transition-all duration-300 ${
                      isActive("/settings")
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                      isActive("/settings")
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-blue-500 group-hover:text-white"
                    }`}>
                      <FiSettings size={18} />
                    </div>
                    <div className="ml-4 flex-1">
                      <span className="text-sm font-medium">Ayarlar</span>
                    </div>
                    {isActive("/settings") && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-blue-500"
                      />
                    )}
                  </Link>
                </motion.div>
              </div>
          </>
        )}
      </div>
    </div>
  );
}
