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
  FiBox,
  FiAward
} from "react-icons/fi";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isInitializing, setIsInitializing] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    onToggleCollapse();
  };

  // Don't render sidebar on login page
  if (pathname === "/auth/login") {
    return null;
  }

  // Main menu items
  const menuItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: <FiHome size={16} />,
      gradient: "from-blue-500 to-blue-600"
    },
    { 
      href: "/courses", 
      label: "Derslerim", 
      icon: <FiBook size={16} />,
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      href: "/exams",
      label: "Sınavlarım",
      icon: <FiFileText size={16} />,
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      href: "/learning-goals",
      label: "Öğrenme Hedeflerim",
      icon: <FiTarget size={16} />,
      gradient: "from-amber-500 to-orange-500"
    },
    { 
      href: "/performance", 
      label: "Performans Analizi", 
      icon: <FiBarChart2 size={16} />,
      gradient: "from-green-500 to-emerald-600"
    },
    { 
      href: "/achievements", 
      label: "Başarılarım", 
      icon: <FiAward size={16} />,
      gradient: "from-rose-500 to-pink-600"
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
      className={`fixed top-0 left-0 h-full z-30 border-r ${isDarkMode ? 'border-gray-800/30' : 'border-gray-200/70'} ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/80'} shadow-lg backdrop-blur-md transition-all duration-200 flex flex-col`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? 'rgba(75, 85, 99, 0.3) transparent' : 'rgba(203, 213, 225, 0.3) transparent'
      }}
    >
      {/* Toggle Button - Modern styled toggle with animated icon */}
      <button
        onClick={handleToggle}
        className={`absolute top-3 right-1.5 w-7 h-7 flex items-center justify-center ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors duration-300 z-10`}
        aria-label={isCollapsed ? "Sidebar'ı Aç" : "Sidebar'ı Kapat"}
      >
        <motion.div
          initial={false}
          style={{ width: 18, height: 18 }}
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          <FiChevronLeft size={16} className="stroke-[1.5px]" />
        </motion.div>
      </button>

      {/* Sidebar Header with glass effect and gradient background */}
      <div className={`h-14 px-4 border-b ${isDarkMode ? 'border-gray-800/30 bg-gradient-to-r from-gray-800/90 to-gray-900/80' : 'border-gray-200/70 bg-gradient-to-r from-white/90 to-gray-50/80'} backdrop-blur-md flex items-center`}>
        <motion.div
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden flex items-center"
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <FiTarget size={12} className="text-white" />
              </div>
              <h2 className={`text-base font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} tracking-wide`}>QuizMaster</h2>
            </div>
          )}
        </motion.div>
      </div>
      <div className="flex-1 flex flex-col">
        {isInitializing ? (
          // Loading placeholder with light theme styling
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-10 ${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-100/90'} rounded-lg animate-pulse`}
              ></div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Main menu items with glass styling and gradients */}
              <nav className="py-3 px-3 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => e.stopPropagation()}
                    className={`group flex items-center py-2.5 px-4 rounded-xl transition-all duration-300 relative ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Active/Inactive state styling with gradients and glass effect */}
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isActive(item.href) 
                      ? `bg-gradient-to-r ${item.gradient} opacity-15 ${isDarkMode ? 'opacity-25' : 'opacity-10'} shadow-md` 
                      : `${isDarkMode ? 'group-hover:bg-gray-800/30' : 'group-hover:bg-gray-100/70'} opacity-0 group-hover:opacity-100`}`}></div>
                    
                    {/* Icon container with conditional gradient background */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${isActive(item.href)
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-sm` 
                        : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isDarkMode ? 'group-hover:text-gray-300' : 'group-hover:text-gray-700'}`
                      }`}
                    >
                      {item.icon}
                    </div>
                    
                    <motion.div 
                      initial={false}
                      animate={{ 
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : "auto",
                        marginLeft: isCollapsed ? 0 : "0.75rem"
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {!isCollapsed && (
                        <span className={`text-sm font-medium relative z-10 ${isActive(item.href) 
                          ? `${isDarkMode ? 'text-blue-300' : 'text-blue-600'}` 
                          : `${isDarkMode ? 'text-gray-300 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'}`
                        }`}>
                          {item.label}
                        </span>
                      )}
                    </motion.div>
                    
                    {/* Active indicator */}
                    {isActive(item.href) && !isCollapsed && (
                      <div className="ml-auto mr-1 h-1.5 w-1.5 rounded-full bg-white opacity-80"></div>
                    )}
                    {isActive(item.href) && isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-1.5 bottom-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-80"
                      />
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Settings button with modern styling */}
              <div className={`border-t ${isDarkMode ? 'border-gray-800/30 bg-gradient-to-b from-gray-800/80 to-gray-900/95' : 'border-gray-200/50 bg-gradient-to-b from-gray-50/80 to-white/95'} backdrop-blur-sm`}>
                <div className="py-3 px-3">
                  <Link
                    href="/settings"
                    onClick={(e) => e.stopPropagation()}
                    className={`group flex items-center py-2.5 px-4 rounded-xl transition-all duration-300 relative ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? "Ayarlar" : undefined}
                  >
                    {/* Background effect */}
                    <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isActive("/settings") 
                      ? `bg-gradient-to-r from-blue-500 to-indigo-600 opacity-15 ${isDarkMode ? 'opacity-25' : 'opacity-10'} shadow-md` 
                      : `${isDarkMode ? 'group-hover:bg-gray-800/30' : 'group-hover:bg-gray-100/70'} opacity-0 group-hover:opacity-100`}`}></div>
                    
                    {/* Icon with gradient */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${isActive("/settings")
                        ? `bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm` 
                        : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isDarkMode ? 'group-hover:text-gray-300' : 'group-hover:text-gray-700'}`
                      }`}
                    >
                      <FiSettings size={16} />
                    </div>
                    <motion.div 
                      initial={false}
                      animate={{ 
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : "auto",
                        marginLeft: isCollapsed ? 0 : "0.75rem"
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {!isCollapsed && (
                        <span className={`text-sm font-medium relative z-10 ${isActive("/settings") 
                          ? `${isDarkMode ? 'text-blue-300' : 'text-blue-600'}` 
                          : `${isDarkMode ? 'text-gray-300 group-hover:text-gray-200' : 'text-gray-600 group-hover:text-gray-800'}`
                        }`}>Ayarlar</span>
                      )}
                    </motion.div>
                    
                    {/* Active indicator */}
                    {isActive("/settings") && !isCollapsed && (
                      <div className="ml-auto mr-1 h-1.5 w-1.5 rounded-full bg-white opacity-80"></div>
                    )}
                    {isActive("/settings") && isCollapsed && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-1.5 bottom-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-80"
                      />
                    )}
                  </Link>
                </div>
              </div>
          </>
        )}
      </div>
      
      {/* Bottom decorative element */}
      <div className={`h-2 w-full ${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-blue-900/20 to-gray-900' : 'bg-gradient-to-r from-white via-blue-100/20 to-white'}`}></div>
    </motion.div>
  );
}
