import apiService from "./api.service";
import { auth } from "@/app/firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { setAuthCookie, removeAuthCookie } from "@/lib/utils";
import { User } from "@/types";
import { adaptUserFromBackend, adaptUserToBackend } from "@/lib/adapters";
import axios, { AxiosError } from "axios";
import { getLogger, getFlowTracker } from "../lib/logger.utils";

// API yanıt tipleri
interface AuthResponse {
  user: User;
  token: string;
}

interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

// Oturum durumu tipi
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

/**
 * Kimlik doğrulama hizmet sınıfı
 * Auth ile ilgili tüm API çağrılarını ve işlemleri yönetir
 */
class AuthService {
  private readonly logger = getLogger();
  private readonly flowTracker = getFlowTracker();
  
  constructor() {
    this.logger.info(
      'AuthService başlatıldı',
      'AuthService.constructor',
      __filename,
      14
    );
  }

  /**
   * E-posta ve şifre ile kayıt
   * @param email Kullanıcı e-postası
   * @param password Kullanıcı şifresi
   * @param userData Kullanıcı bilgileri (ilk adı ve soyadı)
   * @returns Kayıt yanıtı
   */
  async register(
    email: string,
    password: string,
    userData: { firstName?: string; lastName?: string },
  ): Promise<AuthResponse> {
    try {
      // Şifre kontrolü
      console.log("🔄 [AuthService] register() çağrıldı:", {
        email,
        password: password ? "Şifre girilmiş" : "Şifre eksik",
        passwordLength: password?.length,
      });

      if (!password || password.trim() === "") {
        const error = new Error("auth/missing-password");
        console.error("❌ [AuthService] Şifre eksik:", error);
        throw error;
      }

      // Firebase ile yeni kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // ID token al
      const idToken = await userCredential.user.getIdToken();

      // Backend'e kayıt için API çağrısı yap
      const response = await apiService.post<AuthResponse>("/auth/register", {
        idToken,
        ...userData,
      });

      // Token'ı localStorage'a kaydet
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        setAuthCookie(response.token);
      }

      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      console.error("❌ [AuthService] Kayıt hatası:", error);
      throw error;
    }
  }

  /**
   * E-posta ve şifre ile giriş
   * @param email Kullanıcı e-postası
   * @param password Kullanıcı şifresi
   * @returns Giriş yanıtı
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      this.flowTracker.trackStep(
        'Auth',
        'Kullanıcı girişi başlatıldı',
        'AuthService.login',
        { email }
      );
      this.flowTracker.markStart('login');
      
      this.logger.info(
        `Kullanıcı girişi deneniyor: ${email}`,
        'AuthService.login',
        __filename,
        30
      );
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Ölç ve logla
      const duration = this.flowTracker.markEnd('login', 'Auth', 'AuthService.login');
      this.logger.info(
        `Kullanıcı girişi başarılı: ${email}`,
        'AuthService.login',
        __filename,
        39,
        { duration, uid: result.user.uid }
      );
      
      // ID token al
      const idToken = await result.user.getIdToken();
      console.log("🔑 [AuthService] Firebase ID token alındı");

      // Backend'e giriş için API çağrısı yap
      console.log("🔄 [AuthService] Backend login isteği gönderiliyor");
      const response = await apiService.post<AuthResponse>("/auth/login-via-idtoken", {
        idToken,
      });

      console.log("✅ [AuthService] Backend login başarılı:", response);

      // Token'ı localStorage'a kaydet
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        setAuthCookie(response.token);
        console.log("💾 [AuthService] Token localStorage ve cookie'ye kaydedildi");
      }

      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      console.error("❌ [AuthService] Giriş hatası:", error);
      
      // Hata tipini kontrol et ve daha detaylı logla
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(`❌ [AuthService] API Hatası: ${axiosError.code}, Yanıt:`, axiosError.response?.data);
        console.error(`❌ [AuthService] İstek URL: ${axiosError.config?.url}, Metod: ${axiosError.config?.method}`);
      } else if (error instanceof Error) {
        console.error(`❌ [AuthService] Hata mesajı: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Google ile giriş
   * @returns Giriş yanıtı
   */
  async loginWithGoogle(): Promise<GoogleAuthResponse> {
    try {
      const provider = new GoogleAuthProvider();

      // Google ile popup üzerinden giriş yap
      const result = await signInWithPopup(auth, provider);

      // ID token al
      const idToken = await result.user.getIdToken();

      // Backend'e Google giriş için API çağrısı yap
      const response = await apiService.post<GoogleAuthResponse>("/auth/google-sign-in", {
        idToken,
      });

      // Token'ı localStorage'a kaydet
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        setAuthCookie(response.token);
      }

      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      console.error("Google giriş hatası:", error);
      throw error;
    }
  }

  /**
   * Çıkış yap
   * @returns Çıkış işlemi başarılı olup olmadığı
   */
  async signOut(): Promise<void> {
    try {
      this.flowTracker.trackStep(
        'Auth',
        'Kullanıcı çıkışı başlatıldı',
        'AuthService.signOut'
      );
      this.flowTracker.markStart('logout');
      
      this.logger.info(
        'Kullanıcı çıkışı yapılıyor',
        'AuthService.signOut',
        __filename,
        67
      );
      
      await firebaseSignOut(auth);

      // localStorage'dan token'ı temizle
      localStorage.removeItem("auth_token");
      removeAuthCookie();
      
      // Ölç ve logla
      const duration = this.flowTracker.markEnd('logout', 'Auth', 'AuthService.signOut');
      this.logger.info(
        'Kullanıcı çıkışı başarılı',
        'AuthService.signOut',
        __filename,
        76,
        { duration }
      );
    } catch (error: unknown) {
      console.error("Çıkış hatası:", error);
      throw error;
    }
  }

  /**
   * Kullanıcı profili getir
   * @returns Kullanıcı profil bilgileri
   */
  async getProfile(): Promise<User> {
    try {
      const backendUser = await apiService.get<User>("/users/profile");
      return adaptUserFromBackend(backendUser);
    } catch (error: unknown) {
      console.error("Profil getirme hatası:", error);
      throw error;
    }
  }

  /**
   * Kullanıcı profilini güncelle
   * @param profileData Güncellenecek profil verileri
   * @returns Güncellenmiş kullanıcı profili
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      // Firebase kullanıcısını al
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Kullanıcı oturumu bulunamadı");
      }

      // Firebase profilini güncelle (displayName ve photoURL)
      if (profileData.firstName || profileData.lastName) {
        const displayName = [
          profileData.firstName || "",
          profileData.lastName || "",
        ]
          .filter(Boolean)
          .join(" ");

        await firebaseUpdateProfile(currentUser, {
          displayName: displayName || null,
        });
      }

      if (profileData.profileImageUrl) {
        await firebaseUpdateProfile(currentUser, {
          photoURL: profileData.profileImageUrl,
        });
      }

      // Backend'e uygun formata dönüştür
      const backendProfileData = adaptUserToBackend(profileData);

      // Backend'e profil güncellemesi için API çağrısı yap
      const updatedBackendUser = await apiService.put<User>(
        "/users/profile",
        backendProfileData,
      );

      // Frontend tipine dönüştür
      return adaptUserFromBackend(updatedBackendUser);
    } catch (error: unknown) {
      console.error("Profil güncelleme hatası:", error);
      throw error;
    }
  }

  /**
   * Firebase oturum durumu değişikliklerini dinle
   * @param callback Oturum durumu değiştiğinde çağrılacak fonksiyon
   * @returns Dinlemeyi durduracak fonksiyon
   */
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    console.log("🎧 [AuthService] onAuthStateChange başlatılıyor");
    
    let previousAuthState: FirebaseUser | null = null;
    
    return onAuthStateChanged(auth, async (firebaseUser) => {
      // Başlangıçta ve durumda bir değişiklik olmadığında gereksiz log oluşturma
      const isLoginOrInitialState = firebaseUser !== null;
      
      if (isLoginOrInitialState) {
        try {
          console.log("🔑 [AuthService] Token isteniyor");
          // ID token al
          const idToken = await firebaseUser.getIdToken();
          console.log("✅ [AuthService] Token alındı, uzunluk:", idToken.length);

          // Backend'e giriş için API çağrısı yap
          console.log("📡 [AuthService] Backend oturum yenilemesi yapılıyor");
          try {
            const response = await apiService.post<AuthResponse>(
              "/auth/login-via-idtoken",
              { idToken },
            );

            console.log("✅ [AuthService] Backend oturum yenilemesi başarılı");

            // Token'ı localStorage'a kaydet
            if (response.token) {
              localStorage.setItem("auth_token", response.token);
              setAuthCookie(response.token);
              console.log("💾 [AuthService] Token önbelleğe kaydedildi");
            }
          } catch (error) {
            console.error("❌ [AuthService] Backend oturum yenilemesi sırasında hata:", error);
            if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError;
              if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
                console.log("⚠️ [AuthService] Backend bağlantı hatası nedeniyle işleme devam ediliyor");
                // Bağlantı hatası durumunda devam et, oturumu koru
              } else {
                throw error; // Diğer hataları yukarıya fırlat
              }
            } else {
              throw error;
            }
          }
        } catch (error) {
          console.error("❌ [AuthService] onAuthStateChange işlemi sırasında kritik hata:", error);
          
          // Kullanıcı oturumu kapalı, token'ları temizle
          localStorage.removeItem("auth_token");
          removeAuthCookie();
        }
      } else {
        // Kullanıcı oturumu zaten kapalı ise sessizce işle
        // Sadece gerçekten bir oturum kapatma varsa (daha önce kullanıcı varken şimdi yoksa) logla
        if (previousAuthState !== null && previousAuthState !== firebaseUser) {
          console.log("🔓 Firebase Auth: Kullanıcı oturumu kapatıldı");
          localStorage.removeItem("auth_token");
          removeAuthCookie();
        } else {
          // İlk yüklenme veya yenileme sırasında, sessizce token temizliği yap
          const token = localStorage.getItem("auth_token");
          if (token) {
            localStorage.removeItem("auth_token");
            removeAuthCookie();
          }
        }
      }
      
      // Bir sonraki karşılaştırma için mevcut durumu kaydet
      previousAuthState = firebaseUser;
      
      // Callback'i çağır
      try {
        callback(firebaseUser);
      } catch (callbackError) {
        console.error("❌ [AuthService] Callback çağrılırken hata:", callbackError);
      }
    });
  }

  /**
   * Şu anki kullanıcıyı al
   * @returns Firebase kullanıcı nesnesi veya null
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Şu anki kullanıcının token'ini al
   * @returns JWT token veya null
   */
  async getCurrentToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      return await user.getIdToken(true);
    } catch (error) {
      console.error("Token alma hatası:", error);
      return null;
    }
  }

  /**
   * Access token'ı yenile
   * Backend'in /auth/refresh-token endpoint'ini çağırarak HttpOnly cookie içindeki
   * refresh token ile yeni bir access token alır.
   * 
   * @returns {Promise<{token: string}>} Başarılı olursa yeni access token
   * @throws {Error} Token yenilenemezse hata fırlatır
   */
  async refreshToken(): Promise<{token: string}> {
    try {
      // Backend'in refresh token endpoint'ine, HTTP-only cookie içindeki refresh token'ı kullanarak istek at
      // withCredentials: true sayesinde browser otomatik olarak cookie'yi gönderir
      console.log("🔄 Token yenileme işlemi başlatılıyor...");
      
      const response = await apiService.post<{token: string}>("/auth/refresh-token", {}, {
        withCredentials: true, // HTTP-only cookie'lerin gönderilmesi için gerekli
      });
      
      // Yeni token'ı döndür
      if (response.token) {
        console.log("✅ Token başarıyla yenilendi");
        
        // Yeni token'ı localStorage ve cookie'ye kaydet
        localStorage.setItem("auth_token", response.token);
        setAuthCookie(response.token);
        
        return response;
      } else {
        throw new Error("Refresh token yanıtında token bulunamadı");
      }
    } catch (error) {
      console.error("❌ Token yenileme hatası:", error);
      
      // Tüm token'ları temizle
      localStorage.removeItem("auth_token");
      removeAuthCookie();
      
      throw error;
    }
  }

  private formatFirebaseError(error: unknown): { code: string; message: string } {
    // FirebaseError tipini kontrol et
    if (error instanceof FirebaseError) {
      return {
        code: error.code,
        message: this.getFirebaseErrorMessage(error.code)
      };
    }
    
    return {
      code: 'unknown',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata'
    };
  }

  private getFirebaseErrorMessage(code: string): string {
    // Bu metod, Firebase hata kodlarına göre uygun mesajı döndürmelidir.
    // Bu örnekte, basit bir switch-case kullanılmıştır.
    switch (code) {
      case 'auth/user-not-found':
        return 'Kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Şifre yanlış';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta';
      default:
        return 'Bilinmeyen hata';
    }
  }
}

// Singleton instance oluştur ve export et
const authService = new AuthService();
export default authService;
export { authService as AuthService };
