"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiLogIn,
  FiUser,
  FiLogOut,
<<<<<<< HEAD
=======
  FiUserPlus,
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
  FiSettings,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface HeaderProps {
  userName?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

/**
 * Tüm sayfalarda kullanılan ana header bileşeni
 * Yeni stil sistemi entegrasyonu ile güncellenmiştir
 */
const HeaderComponent: React.FC<HeaderProps> = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const { isDarkMode } = useTheme();
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

  return (
<<<<<<< HEAD
    <header className="bg-[#111827]/90 backdrop-blur-sm border-b border-gray-800/30 fixed top-0 left-0 right-0 z-40 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2.5 h-14 flex items-center justify-end">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Tema değiştirme butonu */}
            <ThemeToggle size="sm" />
=======
    <header className="bg-light-background dark:bg-dark-bg-primary border-b border-light-border dark:border-dark-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 text-transparent bg-clip-text mr-2">
              q
            </span>
            <span className="text-xl text-primary-600 dark:text-primary-400 font-medium">
              quiz
            </span>
          </Link>

          {/* Masaüstü Navigasyon */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  pathname === item.path
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                    : "text-light-text-primary dark:text-dark-text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Sağ taraftaki aksiyonlar */}
          <div className="flex items-center space-x-3">
            {/* Tema değiştirme butonu */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label={isDarkMode ? "Açık tema kullan" : "Koyu tema kullan"}
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96

            {/* Ayarlar bağlantısı */}
            <Link 
              href="/settings" 
              prefetch={true}
              className="p-2 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary transition-colors"
              aria-label="Ayarlar"
            >
              <FiSettings />
            </Link>

            {/* Kullanıcı Kimlik Doğrulama Bağlantıları */}
            {isLoading ? (
<<<<<<< HEAD
              <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-gray-700/50 animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white text-base font-bold flex items-center justify-center shadow-md border-2 border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all"
                    style={{ boxShadow: '0 2px 8px 0 rgba(80,80,180,0.10)' }}
                  >
                    {getInitials()}
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-60 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-2xl py-2 z-dropdown border border-gray-700/50">
                      <div className="px-4 py-3 border-b border-gray-700/50">
                        <p className="text-sm font-medium text-gray-200 truncate">{displayName}</p>
                        {user?.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                      </div>
                      <nav className="py-1">
                        <Link href="/profile" prefetch={true}>
                          <div className="flex items-center px-4 py-2.5 text-sm text-primary hover:bg-interactive-hover cursor-pointer transition-colors">
                            <FiUser className="mr-3 text-secondary" />
                            Profil
                          </div>
                        </Link>
                        <Link href="/theme-settings" prefetch={true}>
                          <div className="flex items-center px-4 py-2.5 text-sm text-primary hover:bg-interactive-hover cursor-pointer transition-colors">
                            <FiSettings className="mr-3 text-secondary" />
                            Tema Ayarları
                          </div>
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2.5 text-sm text-primary hover:bg-interactive-hover cursor-pointer transition-colors"
                        >
                          <FiLogOut className="mr-3 text-state-error" />
                          Çıkış Yap
                        </button>
                      </nav>
                    </div>
                  )}
                </div>
              </div>
=======
              <div className="h-8 w-24 bg-light-background-tertiary dark:bg-dark-bg-tertiary rounded animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <Link href="/profile" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-light-text-primary dark:text-dark-text-primary flex items-center"
                  >
                    <FiUser className="mr-1" />
                    {displayName}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-light-text-primary dark:text-dark-text-primary flex items-center"
                  onClick={handleLogout}
                >
                  <FiLogOut className="mr-1" />
                  Çıkış Yap
                </Button>
              </>
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
<<<<<<< HEAD
                    className="text-primary hover:bg-interactive-hover focus:ring-brand-primary flex items-center px-4 py-2 rounded-full"
=======
                    className="text-light-text-primary dark:text-dark-text-primary flex items-center"
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
                  >
                    <FiLogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </Button>
                </Link>
<<<<<<< HEAD
              </div>
            )}
          </div>
=======
                <Link href="/auth/register" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-light-text-primary dark:text-dark-text-primary flex items-center"
                  >
                    <FiUserPlus className="mr-1" />
                    Kayıt Ol
                  </Button>
                </Link>
                <Link href="/auth/forgot-password" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-light-text-primary dark:text-dark-text-primary flex items-center"
                  >
                    <FiKey className="mr-1" />
                    Şifremi Unuttum
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobil menü toggle */}
            <button
              className="p-2 rounded-lg md:hidden text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Mobil menüyü aç/kapat"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        {mobileMenuOpen && (
          <nav className="mt-3 md:hidden border-t border-light-border dark:border-dark-border pt-3 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 ${
                  pathname === item.path
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                    : "text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                }`}
                onClick={closeMobileMenu}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {/* Mobil menüde kimlik doğrulama bağlantılarını da ekleyelim */}
            {!isLoading && !isAuthenticated && (
              <>
                <Link
                  href="/auth/login"
                  prefetch={true}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                  onClick={closeMobileMenu}
                >
                  <FiLogIn className="mr-2" />
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/register"
                  prefetch={true}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                  onClick={closeMobileMenu}
                >
                  <FiUserPlus className="mr-2" />
                  Kayıt Ol
                </Link>
                <Link
                  href="/auth/forgot-password"
                  prefetch={true}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                  onClick={closeMobileMenu}
                >
                  <FiKey className="mr-2" />
                  Şifremi Unuttum
                </Link>
              </>
            )}
            {!isLoading && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-start w-full px-3 py-2 rounded-lg text-sm font-medium my-1 text-light-text-primary dark:text-dark-text-primary hover:bg-light-background-secondary dark:hover:bg-dark-bg-secondary"
                onClick={handleLogout}
              >
                <FiLogOut className="mr-2" />
                Çıkış Yap
              </Button>
            )}
          </nav>
        )}
>>>>>>> 66e977648eb1fd7bb9ac27cf4f26357001f75d96
      </div>
    </header>
  );
};

// Memo ile header bileşenini sarmak - gereksiz yeniden render'ları önler
export const Header = memo(function Header() {
  // Theme context'ten değerleri al
  const { isDarkMode, toggleTheme } = useTheme();
  
  return <HeaderComponent 
    isDarkMode={isDarkMode} 
    onToggleTheme={toggleTheme} 
  />;
});
