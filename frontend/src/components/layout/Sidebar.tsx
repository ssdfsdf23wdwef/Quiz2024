"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
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
      className="fixed top-0 left-0 h-full w-64 z-30 pt-[70px] border-r border-primary bg-secondary transition-colors duration-normal overflow-y-auto"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--color-border-secondary) var(--color-bg-secondary)'
      }}
    >
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
        <div className="flex flex-col h-[calc(100%-70px)] justify-between">
          {/* Ana menü öğeleri */}
          <nav className="flex flex-col gap-1 p-3">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                className={`py-3 px-4 rounded-md flex items-center transition-all duration-normal group ${
                  isActive(item.href)
                    ? "bg-brand-secondary/20 text-brand-primary font-medium"
                    : "text-primary hover:bg-interactive-hover"
                }`}
              >
                <span className={`${isActive(item.href) ? "text-brand-primary" : "text-secondary"} mr-3 transition-colors group-hover:text-brand-primary`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive(item.href) && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-brand-primary"></span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* Ayarlar butonu - En altta ayrı bir grup olarak */}
          <div className="mt-auto p-3 border-t border-primary">
            <Link
              href="/settings"
              onClick={(e) => e.stopPropagation()}
              className={`py-3 px-4 rounded-md flex items-center transition-all duration-normal group ${
                isActive("/settings")
                  ? "bg-brand-secondary/20 text-brand-primary font-medium"
                  : "text-primary hover:bg-interactive-hover"
              }`}
            >
              <span className={`${isActive("/settings") ? "text-brand-primary" : "text-secondary"} mr-3 transition-colors group-hover:text-brand-primary`}>
                <FiSettings size={18} />
              </span>
              <span>Ayarlar</span>
              {isActive("/settings") && (
                <span className="ml-auto h-2 w-2 rounded-full bg-brand-primary"></span>
              )}
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
