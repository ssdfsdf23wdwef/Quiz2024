"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiUser,
  FiMail,
  FiEdit2,
  FiSave,
  FiXCircle,
  FiCamera,
  FiRefreshCw,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { useTheme } from "@/app/context/ThemeContext";
import axios from "axios";
import authService from "@/services/auth.service";

export default function ProfilePage() {
  const { user, updateProfile, checkSession } = useAuth();
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nickName: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [tempProfileImage, setTempProfileImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcı profilini yükle
  const loadUserProfile = useCallback(async () => {
    console.log("Profil bilgileri yükleniyor...");
    setIsLoading(true);
    setError(null);
    
    try {
      // AuthContext'teki kullanıcı verisi yoksa veya yetersizse, direkt API'den yükle
      const userProfile = await authService.getProfile();
      console.log("Profil bilgileri başarıyla yüklendi:", userProfile);
      
      // Form verilerini güncelle
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        nickName: "", // Kullanıcı adı gösterme amacıyla
      });
      
      // Profil resmini ayarla (null değil, undefined veya string olarak)
      setProfileImage(userProfile.profileImageUrl || null);
      
      showToast("Profil bilgileri yüklendi", "success");
    } catch (error) {
      console.error("Profil bilgileri yüklenirken hata:", error);
      setError("Profil bilgileri yüklenemedi. Lütfen sayfayı yenileyin.");
      showToast("Profil bilgileri yüklenemedi", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Sayfa yüklendiğinde ve oturum değiştiğinde kullanıcı bilgilerini çek
  useEffect(() => {
    let isMounted = true; // Component unmount olduğunda işlemleri durdurmak için

    const initializeProfile = async () => {
      console.log("Profile sayfası başlatılıyor...");
      
      if (!isMounted) return; // Component unmount olduysa işlemleri durdur

      try {
        // Oturum durumunu kontrol et
        const isSessionValid = await checkSession();
        console.log("Oturum durumu:", isSessionValid);
        
        if (isSessionValid && isMounted) {
          try {
            // Her zaman API'den en güncel profil bilgilerini al
            // AuthContext'ten gelen veri güncel olmayabilir
            const userProfile = await authService.getProfile();
            console.log("API'den alınan profil bilgileri:", userProfile);
            
            if (isMounted) {
              // Form verilerini API'den gelen güncel bilgilerle doldur
              setFormData({
                firstName: userProfile.firstName || "",
                lastName: userProfile.lastName || "",
                email: userProfile.email || "",
                nickName: "", // Kullanıcı adı gösterme amacıyla
              });
              
              // Profil resmini ayarla
              setProfileImage(userProfile.profileImageUrl || null);
              setIsLoading(false);
            }
          } catch (profileError) {
            console.error("Profil yükleme hatası:", profileError);
            if (isMounted) {
              setError("Profil bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.");
              setIsLoading(false);
            }
          }
        } else if (isMounted) {
          console.log("Geçerli oturum yok, profil bilgileri yüklenemiyor");
          setError("Oturum bulunamadı. Lütfen yeniden giriş yapın.");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Sayfa başlatılırken hata:", error);
        if (isMounted) {
          setError("Sayfa başlatılırken bir hata oluştu. Lütfen sayfayı yenileyin.");
          setIsLoading(false);
        }
      }
    };
    
    initializeProfile();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [checkSession]);

  // Kullanıcı bilgileri değiştiğinde form verilerini güncelle
  useEffect(() => {
    if (user) {
      console.log("AuthContext'ten kullanıcı bilgileri alındı:", user);
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        nickName: "", // Kullanıcı adı gösterme amacıyla kullanacağız
      });
      setProfileImage(user.profileImageUrl || null);
      setTempProfileImage(null);
      
      // AuthContext'ten kullanıcı verisi alındıysa yükleme durumunu kapat
      setIsLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Resim verilerini base64'den File nesnesine dönüştürür
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  // Profil resmini backend'e yükler
  const uploadProfileImage = async (imageFile: File): Promise<string> => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // Backend'e profil resmi yükleme isteği gönder
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/users/profile-image`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true  // Cookie tabanlı kimlik doğrulama için
        }
      );
      
      showToast("Profil resmi başarıyla yüklendi", "success");
      return response.data.imageUrl;
    } catch (error) {
      console.error("Profil resmi yükleme hatası:", error);
      showToast("Profil resmi yüklenirken bir hata oluştu", "error");
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          // Düzenleme modunda geçici olarak göster, düzenleme modu aktif değilse doğrudan yükle
          if (editMode) {
            setTempProfileImage(event.target.result);
          } else {
            handleProfileImageUpload(event.target.result, file.name);
          }
        }
      };

      reader.readAsDataURL(file);
    }
  };

  // Profil resmini yükle ve güncelle
  const handleProfileImageUpload = async (imageDataUrl: string, fileName: string) => {
    try {
      const imageFile = dataURLtoFile(imageDataUrl, fileName);
      const imageUrl = await uploadProfileImage(imageFile);
      
      // Profil resmi URL'sini güncelle
      await updateProfile({
        profileImageUrl: imageUrl
      });
      
      setProfileImage(imageUrl);
      setTempProfileImage(null);
    } catch (error) {
      console.error("Profil resmi güncelleme hatası:", error);
      showToast("Profil resmi güncellenirken bir hata oluştu", "error");
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
      setTempProfileImage(null);
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

      // Eğer yeni bir profil resmi yüklendiyse önce onu işle
      let profileImageUrl: string | undefined = user?.profileImageUrl || undefined;
      if (tempProfileImage) {
        try {
          const imageFile = dataURLtoFile(tempProfileImage, 'profile-image.jpg');
          profileImageUrl = await uploadProfileImage(imageFile);
        } catch (error) {
          console.error("Profil resmi yükleme hatası:", error);
          showToast("Profil resmi yüklenemedi, ancak diğer bilgileriniz güncellenecek", "warning");
          // Hata durumunda profileImageUrl'i undefined olarak ayarla
          profileImageUrl = undefined;
        }
      }

      // Profil bilgilerini güncelle
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        profileImageUrl: profileImageUrl
      });

      setEditMode(false);
      setTempProfileImage(null);
      showToast("Profil bilgileriniz başarıyla güncellendi.", "success");
      
      // Profil bilgilerini yeniden yükle
      await loadUserProfile();
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
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`;
    }
    return formData.email?.[0]?.toUpperCase() || "?";
  };

  const getDisplayName = () => {
    return `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.email || '';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="w-12 h-12 border-t-2 border-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className={isDark ? "text-gray-300" : "text-gray-700"}>Profil bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className={`p-4 rounded-lg ${isDark ? "bg-red-900" : "bg-red-100"} mb-4`}>
          <p className={isDark ? "text-red-200" : "text-red-600"}>{error}</p>
        </div>
        <button 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          onClick={loadUserProfile}
        >
          <FiRefreshCw className="mr-2" />
          Yeniden Dene
        </button>
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
                {(editMode ? tempProfileImage || profileImage : profileImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editMode && tempProfileImage 
                      ? tempProfileImage 
                      : profileImage ? profileImage : ''}
                    alt="Profile"
                    className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100"
                    onError={(e) => {
                      console.error("Profil resmi yüklenemedi");
                      e.currentTarget.src = '/images/default-profile.png'; // Yedek avatar resmi
                    }}
                  />
                ) : (
                  <div className="w-28 h-28 bg-indigo-600 text-white text-3xl font-bold rounded-full flex items-center justify-center">
                    {getInitials()}
                  </div>
                )}

                <label
                  htmlFor="profile-image"
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FiCamera className="text-indigo-600" />
                  )}
                  <input
                    type="file"
                    id="profile-image"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <h2 className={`text-xl font-semibold mt-4 ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                {getDisplayName()}
              </h2>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>{formData.email}</p>

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
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString("tr-TR") 
                      : "Bilgi yok"}
                  </p>
                </div>
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
