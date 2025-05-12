"use client";

import { useState, useEffect } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <motion.button
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
        ${
          isDark
            ? "bg-gray-800 text-amber-300 hover:bg-gray-700 hover:text-amber-200"
            : "bg-gray-100 text-indigo-600 hover:bg-gray-200 hover:text-indigo-500"
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isHovered ? [0, 15, -15, 0] : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        {isDark ? (
          <FiSun className="w-5 h-5" />
        ) : (
          <FiMoon className="w-5 h-5" />
        )}
      </motion.div>

      {/* Görsel Geri Bildirim İpucu */}
      <span className="sr-only">
        {isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      </span>

      {/* Görsel İpucu Balonu (Hover durumunda) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            absolute bottom-full mb-2 px-2 py-1 text-xs rounded whitespace-nowrap shadow-lg
            ${
              isDark
                ? "bg-gray-700 text-gray-200 border border-gray-600"
                : "bg-white text-gray-700 border border-gray-200"
            }
          `}
        >
          {isDark ? "Açık Tema" : "Koyu Tema"}
          <div
            className={`
            absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2
            ${
              isDark
                ? "bg-gray-700 border-r border-b border-gray-600"
                : "bg-white border-r border-b border-gray-200"
            }
          `}
          ></div>
        </motion.div>
      )}
    </motion.button>
  );
}
