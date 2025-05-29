"use client";

import { useAuthStore } from "@/store/auth.store";
import { useAuth as useAuthHook } from "@/hooks/auth/useAuth";
import { useState, useRef, useEffect } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";
import { Button } from "@nextui-org/react";

export default function UserControls() {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuthHook();
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
    <div className="flex items-center gap-4">
      {/* Profil butonu */}
      {isAuthenticated ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 border-2 border-white/30 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl hover:scale-105"
            aria-label="Profil menüsünü aç"
          >
            <span className="text-sm font-bold text-white drop-shadow-md">
              {getInitials()}
            </span>
          </button>

          {isDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50 overflow-hidden transform transition-all duration-200 origin-top-right"
              style={{
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-gray-100/30 dark:border-gray-700/30">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                )}
              </div>
              <nav className="py-1">
                <a
                  href="/profile"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                >
                  <FiUser className="mr-3 text-blue-500" />
                  Profil
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                >
                  <FiLogOut className="mr-3" />
                  Çıkış Yap
                </button>
              </nav>
            </div>
          )}
        </div>
      ) : (
        <a
          href="/auth/login"
          className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          Giriş Yap
        </a>
      )}
    </div>
  );
}
