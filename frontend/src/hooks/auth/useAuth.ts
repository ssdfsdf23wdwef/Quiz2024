import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorService } from "@/services/errorService";
import { useAuthStore } from "@/store/auth.store";
import { checkApiAvailability } from "@/services/api.service";
import { useAuth as useAuthContext } from "@/app/context/AuthContext";

// Firebase hata kodlarını kullanıcı dostu mesajlara çeviren yardımcı fonksiyon
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/invalid-credential":
      return "Geçersiz email veya şifre.";
    case "auth/user-not-found":
      return "Bu email adresiyle kayıtlı bir kullanıcı bulunamadı.";
    case "auth/wrong-password":
      return "Hatalı şifre girdiniz.";
    case "auth/too-many-requests":
      return "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.";
    case "auth/email-already-in-use":
      return "Bu email adresi zaten kullanılıyor.";
    case "auth/missing-password":
      return "Şifre alanı boş bırakılamaz.";
    case "auth/weak-password":
      return "Şifre en az 6 karakter uzunluğunda olmalıdır.";
    case "auth/invalid-email":
      return "Geçersiz email adresi.";
    case "auth/network-request-failed":
      return "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.";
    case "auth/requires-recent-login":
      return "Bu işlem için yakın zamanda giriş yapmanız gerekiyor.";
    case "auth/popup-closed-by-user":
      return "Oturum açma penceresi kapatıldı. Lütfen tekrar deneyin.";
    case "auth/unauthorized-domain":
      return "Bu domain için oturum açma izni bulunmuyor.";
    case "auth/operation-not-allowed":
      return "Bu işlem şu anda izin verilmiyor.";
    default:
      return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }
};

export const useAuth = () => {
  console.log("🔑 [useAuth] useAuth hook çağrıldı");

  const router = useRouter();
  
  // AuthContext'ten doğrudan Firebase etkileşimleri için
  const authContext = useAuthContext();

  // Zustand store'dan kullanıcı durumu ve diğer state'ler için
  const {
    user,
    isLoading,
    isAuthenticated,
  } = useAuthStore();
  
  const [authError, setAuthError] = useState<string | null>(
    authContext.authError
  );
  
  // AuthContext'teki hata durumunu takip et
  useEffect(() => {
    if (authContext.authError) {
      setAuthError(authContext.authError);
    }
  }, [authContext.authError]);

  // Backend bağlantı durumunu kontrol eden fonksiyon
  const checkBackendConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log("🔄 [useAuth] Backend bağlantı kontrolü yapılıyor...");
      await checkApiAvailability();
      console.log("✅ [useAuth] Backend bağlantısı başarılı");
      return true;
    } catch (error) {
      console.error("❌ [useAuth] Backend bağlantı kontrolü başarısız:", error);
      // API servisi otomatik olarak diğer portları deneyecek
      return false;
    }
  }, []);

  // Login işlemi - AuthContext ile entegre
  const login = useCallback(
    async (email: string, password: string) => {
      console.log("🔑 [useAuth] Login işlemi başlatılıyor...", email);
      setAuthError(null);

      try {
        // Backend bağlantı kontrolü
        await checkBackendConnection();

        // AuthContext üzerinden giriş yap
        const response = await authContext.login(email, password);
        
        console.log("🚀 [useAuth] Ana sayfaya yönlendiriliyor...");
        router.push("/");
        
        return response;
      } catch (error: unknown) {
        // Hata işleme
        console.error("❌ [useAuth] Login hatası:", error);

        // Firebase hata mesajlarını kullanıcı dostu mesajlara çevir
        const firebaseError = error as { code?: string; message?: string };
        const errorMessage = firebaseError.code
          ? getFirebaseErrorMessage(firebaseError.code)
          : "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.";

        setAuthError(errorMessage);
        ErrorService.logError(error, errorMessage);
        throw error;
      }
    },
    [router, authContext, checkBackendConnection]
  );

  // Çıkış işlemi - AuthContext ile entegre
  const logout = useCallback(async () => {
    try {
      console.log("🔄 [useAuth] Çıkış işlemi başlatılıyor...");
      
      // AuthContext üzerinden çıkış yap
      await authContext.signOut();
      
      // Token'ları temizle ve giriş sayfasına yönlendir
      console.log("✅ [useAuth] Çıkış işlemi başarılı, login sayfasına yönlendiriliyor");
      router.push("/auth/login");
    } catch (error) {
      console.error("❌ [useAuth] Çıkış hatası:", error);
      setAuthError("Çıkış yapılırken bir hata oluştu.");
      ErrorService.logError(error, "Çıkış yapılırken bir hata oluştu.");
      throw error;
    }
  }, [router, authContext]);

  // Oturum ve token durumunu kontrol et
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      return await authContext.checkSession();
    } catch (error) {
      console.error("❌ [useAuth] Oturum kontrolü hatası:", error);
      return false;
    }
  }, [authContext]);

  // Memoize edilmiş API - gereksiz re-render'ları önlemek için
  const api = useCallback(() => ({
    // Kullanıcı durumu
    user,
    isLoading,
    isAuthenticated,
    authError,
    
    // AuthContext'ten sağlanan Firebase etkileşimleri
    login,
    logout,
    register: authContext.register,
    loginWithGoogle: authContext.loginWithGoogle,
    updateProfile: authContext.updateProfile,
    resetPassword: authContext.resetPassword,
    
    // Doğrulama işlemleri
    checkSession,
  }), [
    user, 
    isLoading, 
    isAuthenticated, 
    authError, 
    login, 
    logout, 
    authContext.register, 
    authContext.loginWithGoogle, 
    authContext.updateProfile, 
    authContext.resetPassword, 
    checkSession
  ]);

  // Hook'un döndürdüğü API'yi memoize edilmiş fonksiyondan alalım
  return api();
};
