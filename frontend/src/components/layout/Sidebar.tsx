"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiTarget,
  FiSettings,
  FiBarChart2,
} from "react-icons/fi";

export default function Sidebar() {
  const { isDarkMode } = useTheme();
  const { isInitializing } = useAuth();
  const pathname = usePathname();

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
    <aside
      className={`fixed top-0 left-0 h-full w-64 z-30 pt-[70px] border-r transition-colors duration-200 overflow-y-auto
        ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#4B5563 #1F2937' : '#E5E7EB #F3F4F6'
      }}
    >
      {isInitializing ? (
        // Yükleme durumunda placeholder göster
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100%-70px)] justify-between">
          {/* Ana menü öğeleri */}
          <nav className="flex flex-col gap-1 p-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                className={`py-3 px-4 rounded-lg flex items-center transition-all duration-200 group ${
                  isActive(item.href)
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70"
                }`}
              >
                <span className={`${isActive(item.href) ? "text-purple-500 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"} mr-3 transition-colors group-hover:text-purple-500 dark:group-hover:text-purple-400`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-400"></span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* Ayarlar butonu - En altta ayrı bir grup olarak */}
          <div className="mt-auto p-3 border-t border-gray-100 dark:border-gray-800">
            <Link
              href="/settings"
              onClick={(e) => e.stopPropagation()}
              className={`py-3 px-4 rounded-lg flex items-center transition-all duration-200 group ${
                isActive("/settings")
                  ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70"
              }`}
            >
              <span className={`${isActive("/settings") ? "text-purple-500 dark:text-purple-400" : "text-gray-500 dark:text-gray-400"} mr-3 transition-colors group-hover:text-purple-500 dark:group-hover:text-purple-400`}>
                <FiSettings size={18} />
              </span>
              <span>Ayarlar</span>
              {isActive("/settings") && (
                <span className="ml-auto h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-400"></span>
              )}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
