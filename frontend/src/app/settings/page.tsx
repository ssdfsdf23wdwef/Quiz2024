"use client";

import React, { useState, useEffect } from "react";
import {
  FiSave,
  FiMoon,
  FiSun,
  FiLock,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiMonitor,
  FiCheck,
  FiType,
  FiSettings,
  FiBell,
  FiHelpCircle
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { ThemeMode } from "@/styles/theme";

export default function SettingsPage() {
  const {
    theme,
    currentMode,
    isDarkMode,
    isSystemTheme,
    setTheme,
    setFontSize,
  } = useTheme();
  
  const [mounted, setMounted] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoStartTimer: true,
    showHints: true,
    language: "tr",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Şifre alanlarının gösterilip gösterilmeyeceğini tutan state
  const [showField, setShowField] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [themeChanged, setThemeChanged] = useState(false);

  const toggleShowPassword = (field: keyof typeof showField) => {
    setShowField((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSettingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }

    setSavedSuccess(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
  };

  const saveSettings = async () => {
    setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
      setIsSubmitting(false);
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Şifreler eşleşmiyor.");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setIsChangingPassword(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Şifreniz başarıyla değiştirildi.");
      setIsChangingPassword(false);
  };

  // Tema değiştirme işlevi
  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    setThemeChanged(true);
    
    // Kullanıcıya görsel bildirim göster
    const toast = document.createElement('div');
    toast.className = 
      `fixed top-4 right-4 z-50 
       ${mode === 'dark' ? 'bg-[#172554]/80' : 'bg-primary-50'} 
       ${mode === 'dark' ? 'text-[#60a5fa]' : 'text-primary-600'} 
       px-4 py-2 rounded-md shadow-md 
       ${mode === 'dark' ? 'border border-[#3b82f6]/40' : 'border border-primary-200'} 
       backdrop-blur-sm flex items-center gap-2`;
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-check">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${mode === 'light' ? 'Açık' : mode === 'dark' ? 'Koyu' : 'Sistem'} tema uygulandı</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 3000);
    
    setTimeout(() => {
      setThemeChanged(false);
    }, 3000);
  };

  // Hızlı tema değiştirme
  const handleToggleTheme = () => {
    if (currentMode === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
    setThemeChanged(true);
    
    // Geçiş animasyonu ekleme
    const root = document.documentElement;
    root.classList.add('theme-transition');
    
    setTimeout(() => {
      root.classList.remove('theme-transition');
      setThemeChanged(false);
    }, 3000);
  };

  const fadeInVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  // Kart stilini merkezi olarak tanımla
  const cardClassName = `rounded-xl p-6 border shadow-sm mb-6 ${isDarkMode ? 'bg-gray-800/90 border-gray-700/30' : 'bg-white border-gray-200/70'}`;

  // Form öğeleri için genel stil
  const inputClassName = "w-full text-sm px-3 py-2.5 bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] rounded-md text-[#0f172a] dark:text-[#f8fafc] focus:ring-2 focus:ring-[#3b82f6]/50 dark:focus:ring-[#60a5fa]/50 focus:border-transparent outline-none transition-colors";
  
  // Toggle butonu stilini merkezi olarak tanımla
  const toggleClassName = "w-10 h-5 bg-[#f1f5f9] dark:bg-[#1e293b] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3b82f6]/30 dark:peer-focus:ring-[#3b82f6]/40 rounded-full peer dark:bg-border-secondary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-white after:border-[#e2e8f0] dark:after:border-[#334155] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3b82f6] dark:peer-checked:bg-[#3b82f6]";

  // Bölüm başlığı stili
  const sectionHeaderClassName = "flex justify-between items-center mb-6";

  if (!mounted) {
    return null; // veya bir yükleme göstergesi
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8"
    >
      {themeChanged && (
        <div className="fixed top-4 right-4 z-50 bg-[#f0fdf4] dark:bg-[#065f46]/20 text-[#10b981] dark:text-[#34d399] px-4 py-2 rounded-md shadow-md border border-[#86efac] dark:border-[#065f46] backdrop-blur-sm">
          Tema değiştirildi: {currentMode === 'light' ? 'Açık' : currentMode === 'dark' ? 'Koyu' : 'Sistem'}
        </div>
      )}

      <motion.div variants={fadeInVariants} className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-[#0f172a] dark:text-[#f8fafc] mb-2">Ayarlar</h1>
        <p className="text-lg text-[#334155] dark:text-[#cbd5e1]">
          Hesap ayarlarınızı ve tercihlerinizi yönetin.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
        <div className="md:col-span-2 space-y-8">
          <motion.section variants={fadeInVariants} className={cardClassName}>
            <header className={sectionHeaderClassName}>
              <h2 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-3">
                <FiSettings className="text-[#3b82f6] dark:text-[#3b82f6]" />
                Görünüm Ayarları
              </h2>
              {savedSuccess && (
                
                <div className="text-sm text-[#10b981] dark:text-[#34d399] bg-[#f0fdf4] dark:bg-[#065f46]/20 px-3 py-1.5 rounded-md flex items-center border border-[#86efac] dark:border-[#065f46] backdrop-blur-sm">
                  <FiCheck className="mr-1.5" />
                  Kaydedildi
                </div>
              )}
            </header>

            <div className={`rounded-md p-4 mb-6 flex items-center gap-4 border ${isDarkMode ? 'bg-gray-900/80 border-gray-700/40' : 'bg-gray-50 border-gray-200/70'} transition-colors duration-300`}>
              {isDarkMode ? (
                <FiMoon className="text-2xl text-[#3b82f6] dark:text-[#60a5fa]" />
              ) : (
                <FiSun className="text-2xl text-[#f59e0b] dark:text-[#fbbf24]" />
              )}
              <div>
                <h3 className="font-medium text-[#0f172a] dark:text-[#f8fafc]">
                  Mevcut Tema: <span className="capitalize font-semibold">{currentMode === 'light' ? 'Açık' : currentMode === 'dark' ? 'Koyu' : 'Sistem'}</span>
                </h3>
                <p className="text-sm text-[#334155] dark:text-[#cbd5e1]">
                  {isSystemTheme 
                    ? 'Sistem tercihini takip ediyor' 
                    : `Manuel olarak ${theme.mode === 'dark' ? 'koyu' : 'açık'} tema ayarlandı`}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h3 className="text-base font-medium text-[#0f172a] dark:text-[#f8fafc] mb-2 flex items-center gap-2">
                <FiMonitor className="text-[#3b82f6] dark:text-[#3b82f6]" />
                Tema Modu
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleThemeChange(mode)}
                    className={`
                      relative p-3 rounded-md border transition-all duration-150 group
                      ${theme.mode === mode
                        ? 'border-[#3b82f6] dark:border-[#3b82f6] bg-[#eff6ff] dark:bg-[#172554]/40 shadow-sm'
                        : 'border-[#e2e8f0] dark:border-[#334155]/60 hover:border-[#60a5fa] dark:hover:border-[#60a5fa]/70 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]/70'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {mode === 'light' && <FiSun className={`text-lg ${theme.mode === mode ? 'text-[#f59e0b] dark:text-[#fbbf24]' : 'text-[#64748b] group-hover:text-[#f59e0b] dark:group-hover:text-[#fbbf24]'}`} />}
                      {mode === 'dark' && <FiMoon className={`text-lg ${theme.mode === mode ? 'text-[#3b82f6] dark:text-[#60a5fa]' : 'text-[#64748b] group-hover:text-[#3b82f6] dark:group-hover:text-[#60a5fa]'}`} />}
                      {mode === 'system' && <FiMonitor className={`text-lg ${theme.mode === mode ? 'text-[#0f172a] dark:text-[#f8fafc]' : 'text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-[#f8fafc]'}`} />}
                      <span className={`text-xs font-medium ${theme.mode === mode ? 'text-[#2563eb] dark:text-[#93c5fd]' : 'text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-[#f8fafc]'} capitalize`}>
                        {mode === 'light' ? 'Açık' : mode === 'dark' ? 'Koyu' : 'Sistem'}
                      </span>
                      {theme.mode === mode && (
                        <FiCheck className="text-[#3b82f6] dark:text-[#60a5fa] absolute top-1.5 right-1.5 text-sm" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleToggleTheme}
                className="mt-3 w-full text-sm px-4 py-2 bg-[#3b82f6] dark:bg-[#3b82f6] hover:bg-[#2563eb] dark:hover:bg-[#2563eb] text-white rounded-md transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <FiRefreshCw className="text-xs"/>
                Hızlı Tema Değiştir
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium text-[#0f172a] dark:text-[#f8fafc] mb-2 flex items-center gap-2">
                <FiType className="text-[#10b981] dark:text-[#34d399]" />
                Yazı Boyutu
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`
                      relative p-3 rounded-md border transition-all duration-150 group
                      ${theme.fontSize === size
                        ? 'border-[#10b981] dark:border-[#34d399] bg-[#f0fdf4] dark:bg-[#065f46]/20 shadow-sm'
                        : 'border-[#e2e8f0] dark:border-[#334155]/60 hover:border-[#34d399]/70 dark:hover:border-[#34d399]/60 hover:bg-[#f8fafc] dark:hover:bg-[#1e293b]/70'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`
                        ${size === 'small' && 'text-xs'}
                        ${size === 'medium' && 'text-sm'}
                        ${size === 'large' && 'text-base'}
                        font-semibold ${theme.fontSize === size ? 'text-[#10b981] dark:text-[#34d399]' : 'text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-[#f8fafc]'}`}
                      >
                        Aa
                      </div>
                      <span className={`text-xs font-medium ${theme.fontSize === size ? 'text-[#10b981] dark:text-[#34d399]' : 'text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-[#f8fafc]'} capitalize`}>
                        {size === 'small' ? 'Küçük' : size === 'medium' ? 'Orta' : 'Büyük'}
                      </span>
                      {theme.fontSize === size && (
                        <FiCheck className="text-[#10b981] dark:text-[#34d399] absolute top-1.5 right-1.5 text-sm" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section variants={fadeInVariants} className={cardClassName}>
            <header className={sectionHeaderClassName}>
              <h2 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-3">
                <FiBell className="text-[#f59e0b] dark:text-[#f59e0b]" />
                Uygulama Tercihleri
              </h2>
            </header>

            <div className="space-y-5">
              {(['emailNotifications', 'autoStartTimer', 'showHints'] as const).map((key) => {
                const labels = {
                  emailNotifications: "E-posta Bildirimleri",
                  autoStartTimer: "Otomatik Zamanlayıcı",
                  showHints: "İpuçlarını Göster"
                };
                const descriptions = {
                  emailNotifications: "Yeni sınavlar ve öneriler için bildirimler alın",
                  autoStartTimer: "Sınavlarda zamanlayıcıyı otomatik başlat",
                  showHints: "Uygulama içi yardımcı ipuçlarını göster"
                };
                return (
                  <div key={key} className={`flex items-center justify-between p-3.5 rounded-md border ${isDarkMode ? 'bg-gray-900/80 border-gray-700/40' : 'bg-white border-gray-200/70'} transition-colors duration-300`}>
                    <div>
                      <h3 className="text-sm font-medium text-[#0f172a] dark:text-[#f8fafc]">{labels[key]}</h3>
                      <p className="text-xs text-[#64748b] dark:text-[#cbd5e1] mt-0.5">
                        {descriptions[key]}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name={key}
                        className="sr-only peer"
                        checked={settings[key]}
                        onChange={handleSettingChange}
                      />
                      <div className={toggleClassName}></div>
                    </label>
                  </div>
                );
              })}

              <div className={`p-3.5 rounded-md border ${isDarkMode ? 'bg-gray-900/80 border-gray-700/40' : 'bg-white border-gray-200/70'} transition-colors duration-300`}>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-[#0f172a] dark:text-[#f8fafc] mb-1.5"
                >
                  Dil
                </label>
                <select
                  id="language"
                  name="language"
                  className={inputClassName}
                  value={settings.language}
                  onChange={handleSettingChange}
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <button
              className={`mt-6 w-full sm:w-auto text-sm px-5 py-2.5 bg-[#3b82f6] dark:bg-[#3b82f6] text-white rounded-md transition-colors duration-150 ${
                isSubmitting
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-[#2563eb] dark:hover:bg-[#2563eb] focus:ring-2 focus:ring-[#3b82f6]/30 dark:focus:ring-[#3b82f6]/40 focus:outline-none"
              }`}
              onClick={saveSettings}
              disabled={isSubmitting}
            >
              <FiSave className="inline-block mr-1.5 text-xs" />
              {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </motion.section>

          <motion.section variants={fadeInVariants} className={cardClassName}>
            <header className={sectionHeaderClassName}>
              <h2 className="text-xl font-semibold text-[#0f172a] dark:text-[#f8fafc] flex items-center gap-3">
                <FiLock className="text-[#ef4444] dark:text-[#f87171]" />
                Şifre Değiştir
              </h2>
            </header>

            {passwordError && (
              <div className="mb-4 p-3 bg-[#fef2f2] dark:bg-[#991b1b]/20 text-sm text-[#ef4444] dark:text-[#f87171] rounded-md border border-[#fca5a5] dark:border-[#991b1b]">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              {(Object.keys(passwordData) as Array<keyof typeof passwordData>).map((field) => {
                const labels = {
                  currentPassword: "Mevcut Şifre",
                  newPassword: "Yeni Şifre",
                  confirmPassword: "Yeni Şifre (Tekrar)"
                };
                const fieldName = field.replace("Password", "").toLowerCase() as keyof typeof showField;
                return (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
                    >
                      {labels[field]}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <input
                        type={showField[fieldName] ? "text" : "password"}
                        id={field}
                        name={field}
                        className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-md border transition-colors duration-150 focus:ring-2 focus:outline-none ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100 focus:ring-blue-600/40 focus:border-blue-700' : 'bg-white border-gray-200 text-gray-800 focus:ring-blue-500/30 focus:border-blue-400'}`}
                        placeholder="••••••••"
                        value={passwordData[field]}
                        onChange={handlePasswordChange}
                      />
                      <button
                        type="button"
                        className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => toggleShowPassword(fieldName)}
                      >
                        {showField[fieldName] ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className={`mt-6 w-full sm:w-auto text-sm px-5 py-2.5 bg-[#ef4444] dark:bg-[#f87171] text-white rounded-md transition-colors duration-150 ${
                isChangingPassword
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-[#dc2626] dark:hover:bg-[#ef4444] focus:ring-2 focus:ring-[#ef4444]/50 dark:focus:ring-[#f87171]/40 focus:outline-none"
              }`}
              onClick={changePassword}
              disabled={
                isChangingPassword ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
            >
              {isChangingPassword
                ? "Şifre Değiştiriliyor..."
                : "Şifre Değiştir"}
            </button>
          </motion.section>
        </div>

        <aside className="md:col-span-1">
          <motion.div
            variants={fadeInVariants}
            className={`${cardClassName} sticky top-8`}
          >
            <h2 className="text-lg font-semibold text-[#0f172a] dark:text-[#f8fafc] mb-3 flex items-center gap-2">
              <FiHelpCircle className="text-[#3b82f6] dark:text-[#60a5fa]"/>
              Yardım & Destek
              </h2>
            <p className="text-sm text-[#334155] dark:text-[#cbd5e1] mb-5">
              Ayarlar veya hesap yönetimi ile ilgili sorun yaşıyorsanız, destek merkezimizi ziyaret edebilir veya bizimle iletişime geçebilirsiniz.
            </p>
            <a 
              href="#" 
              className="block w-full text-center text-sm px-4 py-2.5 bg-[#eff6ff] dark:bg-[#172554]/40 text-[#2563eb] dark:text-[#93c5fd] border border-[#93c5fd] dark:border-[#3b82f6]/30 rounded-md hover:bg-[#dbeafe] dark:hover:bg-[#172554]/60 hover:border-[#60a5fa] dark:hover:border-[#3b82f6]/50 transition-colors duration-150"
            >
              Destek Merkezini Ziyaret Et
            </a>
          </motion.div>
        </aside>
      </div>
    </motion.div>
  );
}
