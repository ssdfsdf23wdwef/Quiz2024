"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  FiHome,
  FiBook,
  FiFileText,
  FiTarget,
  FiUser,
  FiSettings,
  FiLogIn,
  FiUserPlus,
} from "react-icons/fi";

/**
 * Yan menü bileşeni
 * Yeni stil sistemi ile güncellenmiştir
 */
export default function Sidebar() {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, isInitializing } = useAuth();

  // Oturum durumuna göre farklı menü öğeleri
  const authenticatedMenuItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: <FiHome className="mr-2" />,
    },
    { 
      href: "/courses", 
      label: "Derslerim", 
      icon: <FiBook className="mr-2" /> 
    },
    {
      href: "/exams",
      label: "Sınavlarım",
      icon: <FiFileText className="mr-2" />,
    },
    {
      href: "/learning-goals",
      label: "Öğrenme Hedeflerim",
      icon: <FiTarget className="mr-2" />,
    },
    { 
      href: "/performance", 
      label: "Performans Analizi", 
      icon: <FiUser className="mr-2" /> 
    },
    {
      href: "/settings",
      label: "Ayarlar",
      icon: <FiSettings className="mr-2" />,
    },
  ];

  const unauthenticatedMenuItems = [
    { href: "/", label: "Ana Sayfa", icon: <FiHome className="mr-2" /> },
    {
      href: "/auth/login",
      label: "Giriş Yap",
      icon: <FiLogIn className="mr-2" />,
    },
    {
      href: "/auth/register",
      label: "Kayıt Ol",
      icon: <FiUserPlus className="mr-2" />,
    },
  ];

  // Kullanıcının oturum durumuna göre menü öğelerini seç
  const menuItems = isAuthenticated
    ? authenticatedMenuItems
    : unauthenticatedMenuItems;

  return (
    <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 z-30 pt-[70px] border-r transition-colors duration-200 bg-light-background dark:bg-dark-bg-primary border-light-border dark:border-dark-border">
      {isInitializing ? (
        // Yükleme durumunda placeholder göster
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 bg-light-background-tertiary dark:bg-dark-bg-tertiary rounded animate-pulse"
            ></div>
          ))}
        </div>
      ) : (
        <nav className="flex flex-col gap-2 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 px-3 rounded flex items-center text-light-text-primary dark:text-dark-text-primary hover:bg-primary-50 dark:hover:bg-dark-bg-secondary transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </aside>
  );
}
