"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiMoon,
  FiSun,
  FiLogIn,
  FiUser,
  FiKey,
  FiLogOut,
  FiUserPlus,
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

  // Eğer kullanıcı giriş yapmışsa, firstName ve lastName'i veya email'i göster
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      userName ||
      "Kullanıcı"
    : "Kullanıcı";

  // Baş harfleri al
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
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-transparent bg-clip-text mr-2">
              q
            </span>
            <span className="text-xl text-purple-600 dark:text-purple-400 font-medium">
              quiz
            </span>
          </Link>

          {/* Sağ taraftaki aksiyonlar */}
          <div className="flex items-center space-x-3">
            {/* Tema değiştirme butonu */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isDarkMode ? "Açık tema kullan" : "Koyu tema kullan"}
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>

            {/* Kullanıcı Kimlik Doğrulama Bağlantıları */}
            {isLoading ? (
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-purple-600 text-white font-medium flex items-center justify-center hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {getInitials()}
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{displayName}</p>
                    </div>
                    <Link href="/profile" prefetch={true}>
                      <div className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <FiUser className="inline mr-2" />
                        Profil
                      </div>
                    </Link>
                    <div 
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <FiLogOut className="inline mr-2" />
                      Çıkış Yap
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FiLogIn className="mr-1" />
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/auth/register" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FiUserPlus className="mr-1" />
                    Kayıt Ol
                  </Button>
                </Link>
                <Link href="/auth/forgot-password" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FiKey className="mr-1" />
                    Şifremi Unuttum
                  </Button>
                </Link>
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
