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
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAuthStore } from "@/store/auth.store";

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

          {/* Masaüstü Navigasyon */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors ${
                  pathname === item.path
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isDarkMode ? "Açık tema kullan" : "Koyu tema kullan"}
            >
              {isDarkMode ? <FiSun /> : <FiMoon />}
            </button>

            {/* Kullanıcı Kimlik Doğrulama Bağlantıları */}
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : isAuthenticated ? (
              <>
                <Link href="/profile" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    <FiUser className="mr-1" />
                    {displayName}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 flex items-center"
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

            {/* Mobil menü toggle */}
            <button
              className="p-2 rounded-lg md:hidden text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={toggleMobileMenu}
              aria-label="Mobil menüyü aç/kapat"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobil menü */}
        {mobileMenuOpen && (
          <nav className="mt-3 md:hidden border-t border-gray-100 dark:border-gray-800 pt-3 pb-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 ${
                  pathname === item.path
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={closeMobileMenu}
                >
                  <FiLogIn className="mr-2" />
                  Giriş Yap
                </Link>
                <Link
                  href="/auth/register"
                  prefetch={true}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={closeMobileMenu}
                >
                  <FiUserPlus className="mr-2" />
                  Kayıt Ol
                </Link>
                <Link
                  href="/auth/forgot-password"
                  prefetch={true}
                  className="flex items-center px-3 py-2 rounded-lg text-sm font-medium my-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                className="flex items-center justify-start w-full px-3 py-2 rounded-lg text-sm font-medium my-1 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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

// Sadece render olması gereken durumlarda tekrar render olması için memo
export const Header = memo(HeaderComponent);
