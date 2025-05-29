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
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    onToggleCollapse();
  };

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
    <motion.div 
      initial={false}
      animate={{ width: isCollapsed ? "68px" : "240px" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 h-full z-30 border-r border-gray-800/30 bg-[#111827]/95 shadow-lg backdrop-blur-sm transition-colors duration-normal flex flex-col"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(75, 85, 99, 0.3) transparent'
      }}
    >
      {/* Toggle Button - Sağ üst köşede, arka plan olmayan minimal tasarım */}
      <button
        onClick={handleToggle}
        className="absolute top-4 right-2 w-6 h-6 flex items-center justify-center text-gray-400/60 hover:text-gray-300 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200 z-10"
        aria-label={isCollapsed ? "Sidebar'ı Aç" : "Sidebar'ı Kapat"}
      >
        <motion.div
          initial={false}
          style={{ width: 16, height: 16 }}
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <FiChevronLeft size={16} className="stroke-[1.5px]" />
        </motion.div>
      </button>

      {/* Sidebar Header - Sabit yükseklikli olarak düzenlendi */}
      <div className="h-12 px-4 border-b border-gray-800/30 bg-gradient-to-r from-gray-900 to-gray-900/80 flex items-center">
        <motion.h2 
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="text-base font-medium text-gray-200/80 tracking-wide ml-1"
        >
          {!isCollapsed && "Menü"}
        </motion.h2>
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
              <nav className="py-2 px-3 space-y-0.5">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => e.stopPropagation()}
                    className={`py-2.5 px-4 rounded-md flex items-center transition-all duration-200 group relative ${
                      isActive(item.href)
                        ? "bg-blue-900/20 text-blue-300 font-medium"
                        : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={`${isActive(item.href) ? "text-blue-400" : "text-gray-400"} ${isCollapsed ? "" : "mr-3"} transition-colors group-hover:text-blue-300`}>
                      {item.icon}
                    </span>
                    <motion.span 
                      initial={false}
                      animate={{ 
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : "auto"
                      }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap"
                    >
                      {!isCollapsed && item.label}
                    </motion.span>
                    {isActive(item.href) && !isCollapsed && (
                      <span className="ml-auto h-1 w-1 rounded-full bg-blue-400 opacity-70"></span>
                    )}
                    {isActive(item.href) && isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-1 top-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 opacity-70"
                      />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Ayarlar butonu - En altta sabit */}
              <div className="border-t border-gray-800/30 bg-gradient-to-b from-gray-900/80 to-gray-900/95">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/settings"
                    onClick={(e) => e.stopPropagation()}
                    className={`group flex items-center py-3.5 px-5 transition-all duration-200 relative ${
                      isActive("/settings")
                        ? "text-blue-300 bg-blue-900/20"
                        : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-300"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? "Ayarlar" : undefined}
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 ${
                      isActive("/settings")
                        ? "bg-gradient-to-r from-blue-600/40 to-blue-800/50 text-blue-300"
                        : "bg-transparent text-gray-400 group-hover:text-blue-300"
                    }`}>
                      <FiSettings size={17} />
                    </div>
                    <motion.div 
                      initial={false}
                      animate={{ 
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : "auto"
                      }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 flex-1 overflow-hidden"
                    >
                      {!isCollapsed && (
                        <span className="text-sm font-medium whitespace-nowrap">Ayarlar</span>
                      )}
                    </motion.div>
                    {isActive("/settings") && !isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1 h-1 rounded-full bg-blue-400 opacity-70 ml-2"
                      />
                    )}
                    {isActive("/settings") && isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-1 top-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 opacity-70"
                      />
                    )}
                  </Link>
                </motion.div>
              </div>
          </>
        )}
      </div>
      
    </motion.div>
  );
}
