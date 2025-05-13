"use client";

import { useState, useEffect } from "react";
import {
  FiSave,
  FiMoon,
  FiSun,
  FiLock,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { isDarkMode, setThemeMode } = useTheme();

  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    autoStartTimer: true,
    showHints: true,
    language: "tr",
  });

  // Tema durumunu settings'e yansıt
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      darkMode: isDarkMode,
    }));
  }, [isDarkMode]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const toggleShowPassword = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
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

      // Tema değişikliği için setThemeMode'u çağır
      if (name === "darkMode") {
        // Checkbox işaretlendiyse dark, işaretlenmediyse light
        const newMode = e.target.checked ? "dark" : "light";
        setThemeMode(newMode);
      }
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

    try {
      // Burada normalde Firebase kullanacaktık
      // Ancak bu kısım Firebase entegrasyonu için bekletilecek

      // Şimdilik mock bir davranış uygulayalım
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSavedSuccess(true);

      // 3 saniye sonra başarı mesajını gizle
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Ayarları kaydetme hatası:", error);
      alert("Ayarlar kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
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

    try {
      // Burada normalde Firebase Authentication kullanacaktık
      // Ancak bu kısım Firebase entegrasyonu için bekletilecek

      // Şimdilik mock bir davranış uygulayalım
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Başarılı değişiklik sonrası
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      alert("Şifreniz başarıyla değiştirildi.");
    } catch (error) {
      console.error("Şifre değiştirme hatası:", error);
      setPasswordError(
        "Şifre değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ayarlar</h1>
        <p className="text-gray-600">
          Hesap ayarlarınızı ve tercihlerinizi yönetin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-800">
                Uygulama Tercihleri
              </h2>

              {savedSuccess && (
                <div className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm flex items-center">
                  <FiRefreshCw className="animate-spin mr-1" />
                  Kaydedildi!
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-medium">Karanlık Mod</h3>
                  <p className="text-gray-500 text-sm">
                    Uygulamada karanlık temayı etkinleştirin
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="darkMode"
                    className="sr-only peer"
                    checked={settings.darkMode}
                    onChange={handleSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2">
                    {settings.darkMode ? (
                      <FiMoon className="text-indigo-600" />
                    ) : (
                      <FiSun className="text-gray-500" />
                    )}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-medium">
                    E-posta Bildirimleri
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Yeni sınavlar ve öneriler için bildirimler alın
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={handleSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-medium">
                    Otomatik Zamanlayıcı
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Sınavlarda zamanlayıcıyı otomatik başlat
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="autoStartTimer"
                    className="sr-only peer"
                    checked={settings.autoStartTimer}
                    onChange={handleSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-800 font-medium">
                    İpuçlarını Göster
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Uygulama içi yardımcı ipuçlarını göster
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="showHints"
                    className="sr-only peer"
                    checked={settings.showHints}
                    onChange={handleSettingChange}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Dil
                </label>
                <select
                  id="language"
                  name="language"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={settings.language}
                  onChange={handleSettingChange}
                >
                  <option value="tr">Türkçe</option>
                </select>
              </div>
            </div>

            <button
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${
                isSubmitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-indigo-700"
              }`}
              onClick={saveSettings}
              disabled={isSubmitting}
            >
              <FiSave className="inline-block mr-2" />
              {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-lg font-medium text-gray-800 mb-6">
              Şifre Değiştir
            </h2>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Mevcut Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => toggleShowPassword("current")}
                  >
                    {showPasswords.current ? (
                      <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Yeni Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => toggleShowPassword("new")}
                  >
                    {showPasswords.new ? (
                      <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-gray-700 text-sm font-medium mb-2"
                >
                  Yeni Şifre (Tekrar)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => toggleShowPassword("confirm")}
                  >
                    {showPasswords.confirm ? (
                      <FiEyeOff className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              className={`mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md ${
                isChangingPassword
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-indigo-700"
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
          </motion.div>
        </div>
      </div>
    </>
  );
}
