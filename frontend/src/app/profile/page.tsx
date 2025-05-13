"use client";

import { useState, useEffect } from "react";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiSave,
  FiXCircle,
  FiCamera,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfilePage() {
  const { user, updateProfile, checkSession } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    // Kullanıcı adı gösterme amacıyla kullanacağız
    nickName: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kullanıcı bilgileri değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        nickName: "", // Kullanıcı adı gösterme amacıyla kullanacağız
      });
      setProfileImage(user.profileImageUrl || null);
    }
  }, [user]);

  // Oturum kontrolü
  useEffect(() => {
    const verifySession = async () => {
      await checkSession();
    };
    verifySession();
  }, [checkSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Dosya boyutunu kontrol et
      if (file.size > 2 * 1024 * 1024) {
        // 2 MB
        showToast("Dosya boyutu 2 MB'dan küçük olmalıdır.", "error");
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          setProfileImage(event.target.result);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const cancelEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        nickName: "", 
      });
      setProfileImage(user.profileImageUrl || null);
    }
    setEditMode(false);
    showToast("Değişiklikler iptal edildi.", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Form doğrulama
      if (!formData.firstName || !formData.lastName) {
        showToast("Ad ve soyad alanları zorunludur.", "error");
        setIsSubmitting(false);
        return;
      }

      // Profil bilgilerini güncelle
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        // nickName backend'e gönderilmez çünkü User tipinde bu alan yok
      });

      setEditMode(false);
      showToast("Profil bilgileriniz başarıyla güncellendi.", "success");
    } catch (error) {
      console.error("Profil güncelleme hatası:", error);
      showToast(
        "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user?.email?.[0]?.toUpperCase() || "?";
  };

  const getDisplayName = () => {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1
          className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-800"} mb-2`}
        >
          Profil Bilgilerim
        </h1>
        <p className={isDark ? "text-gray-300" : "text-gray-600"}>
          Kişisel bilgilerinizi görüntüleyin ve düzenleyin.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                  />
                ) : (
                  <div className="w-28 h-28 bg-indigo-600 text-white text-3xl font-bold rounded-full flex items-center justify-center">
                    {getInitials()}
                  </div>
                )}

                {editMode && (
                  <label
                    htmlFor="profile-image"
                    className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <FiCamera className="text-indigo-600" />
                    <input
                      type="file"
                      id="profile-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <h2 className={`text-xl font-semibold mt-4 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                {getDisplayName()}
              </h2>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>{user.email}</p>

              {!editMode && (
                <button
                  className="mt-6 flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
                  onClick={() => setEditMode(true)}
                >
                  <FiEdit2 className="mr-2" />
                  Profili Düzenle
                </button>
              )}
            </div>

            <div className="mt-8">
              <h3 className={`text-lg font-medium ${isDark ? "text-gray-100" : "text-gray-800"} mb-4`}>
                Hesap Bilgileri
              </h3>
              <div className="space-y-4">
                <div>
                  <p className={isDark ? "text-sm text-gray-400" : "text-sm text-gray-500"}>Oluşturulma Tarihi</p>
                  <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString("tr-TR") 
                      : "Bilgi yok"}
                  </p>
                </div>
                {/* lastLogin alanını kaldırdık çünkü User tipinde yok */}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                Profil Detayları
              </h3>

              {editMode && (
                <div className="flex space-x-2">
                  <button
                    className={`flex items-center px-3 py-1 text-sm border ${isDark ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"} rounded-md`}
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                  >
                    <FiXCircle className="mr-1" />
                    İptal
                  </button>
                  <button
                    className={`flex items-center px-3 py-1 text-sm bg-indigo-600 text-white rounded-md ${isSubmitting ? "opacity-70" : "hover:bg-indigo-700"}`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <FiSave className="mr-1" />
                    {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className={`block ${isDark ? "text-gray-300" : "text-gray-700"} text-sm font-medium mb-2`}
                  >
                    Ad
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className={`w-full pl-10 pr-3 py-2 border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 text-gray-700"} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="Adınız"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className={`block ${isDark ? "text-gray-300" : "text-gray-700"} text-sm font-medium mb-2`}
                  >
                    Soyad
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className={`w-full pl-10 pr-3 py-2 border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 text-gray-700"} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="Soyadınız"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="nickName"
                  className={`block ${isDark ? "text-gray-300" : "text-gray-700"} text-sm font-medium mb-2`}
                >
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="nickName"
                    name="nickName"
                    className={`w-full pl-10 pr-3 py-2 border ${isDark ? "bg-gray-700 border-gray-600 text-gray-100" : "border-gray-300 text-gray-700"} rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Kullanıcı Adınız"
                    value={formData.nickName}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
                <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Bu isim, platformda görünen isminiz olacaktır. Boş
                  bırakırsanız ad ve soyadınız görüntülenecektir.
                </p>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className={`block ${isDark ? "text-gray-300" : "text-gray-700"} text-sm font-medium mb-2`}
                >
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full pl-10 pr-3 py-2 ${isDark ? "bg-gray-600 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-300 text-gray-700"} border rounded-md`}
                    value={formData.email}
                    disabled
                  />
                </div>
                <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  E-posta adresiniz değiştirilemez. Desteğe başvurun.
                </p>
              </div>
            </form>

            <div className="mt-8">
              <h3 className={`text-lg font-medium ${isDark ? "text-gray-100" : "text-gray-800"} mb-4`}>
                Öğrenme İstatistikleri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className={`${isDark ? "bg-indigo-900" : "bg-indigo-50"} p-4 rounded-lg`}>
                  <h4 className={`text-sm font-medium ${isDark ? "text-indigo-300" : "text-indigo-800"} mb-2`}>
                    Toplam Sınav
                  </h4>
                  <p className={`text-2xl font-bold ${isDark ? "text-indigo-200" : "text-indigo-700"}`}>
                    0
                  </p>
                </div>

                <div className={`${isDark ? "bg-green-900" : "bg-green-50"} p-4 rounded-lg`}>
                  <h4 className={`text-sm font-medium ${isDark ? "text-green-300" : "text-green-800"} mb-2`}>
                    Uzmanlaşılan Konular
                  </h4>
                  <p className={`text-2xl font-bold ${isDark ? "text-green-200" : "text-green-700"}`}>
                    0
                  </p>
                </div>

                <div className={`${isDark ? "bg-amber-900" : "bg-amber-50"} p-4 rounded-lg`}>
                  <h4 className={`text-sm font-medium ${isDark ? "text-amber-300" : "text-amber-800"} mb-2`}>
                    Geliştirilmesi Gereken
                  </h4>
                  <p className={`text-2xl font-bold ${isDark ? "text-amber-200" : "text-amber-700"}`}>
                    0
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
