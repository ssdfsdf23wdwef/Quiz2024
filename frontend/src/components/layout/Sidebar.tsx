"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiTarget,
  FiSettings,
  FiBarChart2,
  FiLogOut,
  FiLogIn,
  FiUser,
} from "react-icons/fi";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth.store";
import { useAuth as useAuthHook } from "@/hooks/auth/useAuth";
import { useState, useRef, useEffect } from "react";
import { Button } from "@nextui-org/react";

export default function Sidebar() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isInitializing } = useAuth();
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { logout } = useAuthHook();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      "Kullanıcı"
    : "Kullanıcı";

  const getInitials = () => {
    if (!user) return "K";
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (user.email) {
      return user.email[0].toUpperCase();
    } else {
      return "K";
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  // Dropdown dışına tıklandığında dropdown'ı kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      {/* Üst kısım - Tema ve Profil Butonları */}
      <div className="p-4 border-b border-primary bg-secondary/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Tema değiştirme butonu */}
          <ThemeToggle size="sm" />

          {/* Kullanıcı Kimlik Doğrulama - Geliştirilmiş profil butonu */}
          {isLoading ? (
            <div className="h-10 w-10 bg-tertiary/50 border border-primary/30 rounded-full animate-pulse"></div>
          ) : isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary border-2 border-white/30 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl hover:scale-105"
                aria-label="Profil menüsünü aç"
              >
                <span className="text-sm font-bold text-white drop-shadow-md">{getInitials()}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50 overflow-hidden transform transition-all duration-200 origin-top-right"
                     style={{
                       backdropFilter: 'blur(12px)',
                       WebkitBackdropFilter: 'blur(12px)'
                     }}
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-brand-primary/5 to-transparent border-b border-gray-100/30 dark:border-gray-700/30">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{displayName}</p>
                    {user?.email && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>}
                  </div>
                  <nav className="py-1">
                    <Link href="/profile" prefetch={true}>
                      <div className="flex items-center px-4 py-3 text-sm text-primary hover:bg-interactive-hover cursor-pointer transition-colors">
                        <FiUser className="mr-3 text-brand-primary" />
                        Profil
                      </div>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-primary hover:bg-interactive-hover cursor-pointer transition-colors"
                    >
                      <FiLogOut className="mr-3 text-state-error" />
                      Çıkış Yap
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/login" prefetch={true}>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-interactive-hover focus:ring-brand-primary flex items-center px-3 py-2 rounded-md border border-brand-primary/30 hover:border-brand-primary"
              >
                <FiLogIn className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
            </Link>
          )}
        </div>
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
            <div className="sticky bottom-0 left-0 right-0 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
              <Link
                href="/settings"
                onClick={(e) => e.stopPropagation()}
                className={`py-4 px-6 flex items-center transition-all duration-200 group ${
                  isActive("/settings")
                    ? "text-brand-primary font-medium bg-brand-primary/5"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                }`}
              >
                <FiSettings 
                  size={20} 
                  className={`mr-3 transition-colors ${
                    isActive("/settings") 
                      ? "text-brand-primary" 
                      : "text-gray-500 dark:text-gray-400 group-hover:text-brand-primary"
                  }`} 
                />
                <span className="text-sm font-medium">Ayarlar</span>
                {isActive("/settings") && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-brand-primary"></span>
                )}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
