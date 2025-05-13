"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

interface ThemeSwitcherProps {
  className?: string;
  variant?: "icon" | "full" | "dropdown";
}

export default function ThemeSwitcher({
  className = "",
  variant = "icon",
}: ThemeSwitcherProps) {
  const { theme, setThemeMode, isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration uyumsuzluğunu önlemek için client-side'da mount olduğunda göster
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".theme-switcher-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen]);

  // Eğer client-side'da değilse, hydration uyumsuzluğunu önlemek için boş div döndür
  if (!mounted) {
    return <div className={`w-8 h-8 ${className}`} />;
  }

  // Sadece ikon gösteren versiyon
  if (variant === "icon") {
    return (
      <button
        onClick={() => setThemeMode(isDarkMode ? "light" : "dark")}
        className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        aria-label={isDarkMode ? "Açık temaya geç" : "Koyu temaya geç"}
      >
        {isDarkMode ? (
          <FiSun className="text-yellow-500" size={20} />
        ) : (
          <FiMoon className="text-indigo-600" size={20} />
        )}
      </button>
    );
  }

  // Dropdown versiyon
  if (variant === "dropdown") {
    return (
      <div className="relative theme-switcher-dropdown">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
          aria-label="Tema seçenekleri"
        >
          {theme.mode === "light" && <FiSun className="text-yellow-500" size={20} />}
          {theme.mode === "dark" && <FiMoon className="text-indigo-600" size={20} />}
          {theme.mode === "system" && (
            <FiMonitor className="text-gray-600 dark:text-gray-300" size={20} />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  setThemeMode("light");
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  theme.mode === "light"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FiSun className="mr-3 text-yellow-500" size={18} />
                Açık Tema
              </button>
              <button
                onClick={() => {
                  setThemeMode("dark");
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  theme.mode === "dark"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FiMoon
                  className="mr-3 text-indigo-600 dark:text-indigo-400"
                  size={18}
                />
                Koyu Tema
              </button>
              <button
                onClick={() => {
                  setThemeMode("system");
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  theme.mode === "system"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <FiMonitor
                  className="mr-3 text-gray-600 dark:text-gray-400"
                  size={18}
                />
                Sistem Teması
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tam versiyon (metin + ikon)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => setThemeMode("light")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          theme.mode === "light"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <FiSun className="text-yellow-500" size={18} />
        <span>Açık</span>
      </button>
      <button
        onClick={() => setThemeMode("dark")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          theme.mode === "dark"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <FiMoon className="text-indigo-600 dark:text-indigo-400" size={18} />
        <span>Koyu</span>
      </button>
      <button
        onClick={() => setThemeMode("system")}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          theme.mode === "system"
            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <FiMonitor className="text-gray-600 dark:text-gray-400" size={18} />
        <span>Sistem</span>
      </button>
    </div>
  );
}
