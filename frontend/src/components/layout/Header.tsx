"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiMoon,
  FiSun,
  FiLogIn,
  FiUser,
  FiLogOut,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  userName?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

/**
 * Tüm sayfalarda kullanılan ana header bileşeni
 */
const HeaderComponent: React.FC<HeaderProps> = ({
  userName,
  isDarkMode = false,
  onToggleTheme = () => {},
}) => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      userName ||
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

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center group">
            <span className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-transparent bg-clip-text mr-1.5 group-hover:opacity-80 transition-opacity">
              q
            </span>
            <span className="text-2xl text-slate-700 dark:text-sky-400 font-semibold group-hover:text-indigo-600 dark:group-hover:text-sky-300 transition-colors">
              quiz
            </span>
          </Link>

          {/* Sağ taraftaki aksiyonlar */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Tema değiştirme butonu */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
              aria-label={isDarkMode ? "Açık tema kullan" : "Koyu tema kullan"}
            >
              {isDarkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>

            {/* Kullanıcı Kimlik Doğrulama Bağlantıları */}
            {isLoading ? (
              <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-semibold flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 shadow-md"
                >
                  {getInitials()}
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl py-2 z-20 border border-slate-200 dark:border-slate-700 focus:outline-none">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{displayName}</p>
                      {user?.email && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>}
                    </div>
                    <nav className="py-1">
                      <Link href="/profile" prefetch={true}>
                        <div className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 cursor-pointer transition-colors">
                          <FiUser className="mr-3 text-slate-500 dark:text-slate-400" />
                          Profil
                        </div>
                      </Link>
                      <div 
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 cursor-pointer transition-colors"
                      >
                        <FiLogOut className="mr-3 text-rose-500 dark:text-rose-400" />
                        Çıkış Yap
                      </div>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 focus:ring-sky-500 dark:focus:ring-sky-400 flex items-center px-4 py-2"
                  >
                    <FiLogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </Button>
                </Link>
                {/* Optional: Sign Up button if needed */}
                {/* 
                <Link href="/auth/register" prefetch={true}>
                  <Button
                    variant="solid"
                    size="sm"
                    className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white px-4 py-2"
                  >
                    Kayıt Ol
                  </Button>
                </Link>
                */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Memo ile header bileşenini sarmak - gereksiz yeniden render'ları önler
export const Header = memo(function Header() {
  // Theme context'ten değerleri al
  const theme = useTheme();
  const isDarkMode = theme.isDarkMode;
  const toggleTheme = () => theme.setThemeMode(isDarkMode ? "light" : "dark");
  
  return <HeaderComponent 
    isDarkMode={isDarkMode} 
    onToggleTheme={toggleTheme} 
  />;
});
