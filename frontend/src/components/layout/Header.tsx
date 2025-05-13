"use client";

import React, { useState, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBook,
  FiFileText,
  FiTarget,
  FiMoon,
  FiSun,
  FiLogIn,
  FiUser,
  FiKey,
  FiLogOut,
  FiUserPlus,
  FiSettings,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface HeaderProps {
  userName?: string;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

/**
 * Tüm sayfalarda kullanılan ana header bileşeni
 * Yeni stil sistemi entegrasyonu ile güncellenmiştir
 */
const HeaderComponent: React.FC<HeaderProps> = ({
  userName,
  isDarkMode = false,
  onToggleTheme = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();

  // Eğer kullanıcı giriş yapmışsa, firstName ve lastName'i veya email'i göster
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email ||
      userName ||
      "Kullanıcı"
    : "Kullanıcı";

  const navItems: NavItem[] = [
    { path: "/", label: "Ana Sayfa", icon: <FiHome /> },
    { path: "/courses", label: "Kurslarım", icon: <FiBook /> },
    { path: "/exams", label: "Sınavlar", icon: <FiFileText /> },
    {
      path: "/learning-goals",
      label: "Öğrenme Hedeflerim",
      icon: <FiTarget />,
    },
  ];

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    setMobileMenuOpen(false);
    await logout();
  }, [logout]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
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
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-light-text-primary dark:text-dark-text-primary flex items-center"
                  >
                    <FiLogIn className="mr-1" />
                    Giriş Yap
                  </Button>
                </Link>
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
