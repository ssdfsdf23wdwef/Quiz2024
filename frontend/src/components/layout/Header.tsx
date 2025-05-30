"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FiLogIn,
  FiUser,
  FiLogOut,
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
    <header className="bg-[#111827]/90 backdrop-blur-sm border-b border-gray-800/30 fixed top-0 left-0 right-0 z-40 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2.5 h-14 flex items-center justify-end">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Tema değiştirme butonu */}
            <ThemeToggle size="sm" />

            {/* Kullanıcı Kimlik Doğrulama Bağlantıları */}
            {isLoading ? (
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
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" prefetch={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-interactive-hover focus:ring-brand-primary flex items-center px-4 py-2 rounded-full"
                  >
                    <FiLogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            )}
          </div>
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
