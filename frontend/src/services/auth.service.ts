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
import { getLogger, getFlowTracker, FlowCategory, trackFlow, mapToTrackerCategory } from "../lib/logger.utils";

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
  /**
   * ID token ile giriş işlemi - Firebase tarafından alınan token ile backend'e doğrulama yapar
   * @param idToken Firebase'den alınan kimlik doğrulama token'ı
   * @returns Backend yanıtı (kullanıcı bilgileri ve session token)
   */
  async loginWithIdToken(idToken: string): Promise<AuthResponse> {
    try {
      trackFlow(
        'ID Token ile giriş başlatıldı',
        'AuthService.loginWithIdToken',
        FlowCategory.Auth
      );
      
      this.logger.debug(
        'ID Token ile backend login isteği gönderiliyor',
        'AuthService.loginWithIdToken',
        __filename,
        141
      );
      
      const response = await apiService.post<AuthResponse>("/auth/login-via-idtoken", {
        idToken,
      });

      this.logger.info(
        'ID Token ile login başarılı',
        'AuthService.loginWithIdToken',
        __filename,
        149,
        { userId: response.user.id }
      );

      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      this.logger.error(
        'ID Token ile giriş hatası',
        'AuthService.loginWithIdToken',
        __filename,
        166,
        { error: this.formatFirebaseError(error) }
      );
      
      throw error;
    }
  }

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
      this.logger.info(
        'Kullanıcı kaydı başlatılıyor',
        'AuthService.register',
        __filename,
        50,
        { email }
      );
      
      trackFlow(
        'Kullanıcı kaydı başlatıldı',
        'AuthService.register',
        FlowCategory.Auth,
        { email }
      );

      if (!password || password.trim() === "") {
        const error = new Error("auth/missing-password");
        this.logger.error(
          'Şifre eksik',
          'AuthService.register',
          __filename,
          64,
          { error }
        );
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

      // Bunun yerine loginWithIdToken çağır, bu metod backend'de kullanıcıyı oluşturacak/güncelleyecektir.
      // userData'nın (firstName, lastName) nasıl işleneceği ayrıca değerlendirilmeli.
      // Belki loginWithIdToken backend'de bu bilgileri Firebase'den alır veya ayrı bir updateProfile gerekir.
      const loginResponse = await this.loginWithIdToken(idToken);

      // Eğer Firebase'de displayName güncellenmemişse ve userData varsa güncelleyelim.
      // Bu, Firebase Console'da kullanıcının adının görünmesine yardımcı olabilir.
      if (userData.firstName && userCredential.user.displayName !== `${userData.firstName} ${userData.lastName || ''}`.trim()) {
        try {
          await firebaseUpdateProfile(userCredential.user, {
            displayName: `${userData.firstName} ${userData.lastName || ''}`.trim(),
          });
          this.logger.info(
            'Firebase kullanıcı profili (displayName) güncellendi.',
            'AuthService.register',
            __filename,
            100 // Satır numarasını kontrol edin
          );
        } catch (profileError) {
          this.logger.warn(
            'Firebase kullanıcı profili (displayName) güncellenemedi.',
            'AuthService.register',
            __filename,
            106, // Satır numarasını kontrol edin
            { error: this.formatFirebaseError(profileError) }
          );
        }
      }

      // Token artık backend tarafından HttpOnly cookie olarak yönetiliyor
      // localStorage kullanımını kaldırıyoruz
      
      // User tipini dönüştür
      // return {
      //   ...response,
      //   user: adaptUserFromBackend(response.user),
      // };
      return loginResponse; // loginWithIdToken yanıtını döndür

    } catch (error: unknown) {
      this.logger.error(
        'Kayıt hatası',
        'AuthService.register',
        __filename,
        92,
        { error: this.formatFirebaseError(error) }
      );
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
      trackFlow(
        'Kullanıcı girişi başlatıldı',
        'AuthService.login',
        FlowCategory.Auth,
        { email }
      );
      this.flowTracker.markStart('login');
      
      this.logger.info(
        `Kullanıcı girişi deneniyor: ${email}`,
        'AuthService.login',
        __filename,
        116
      );
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Ölç ve logla
      const duration = this.flowTracker.markEnd('login', mapToTrackerCategory(FlowCategory.Auth), 'AuthService.login');
      this.logger.info(
        `Kullanıcı girişi başarılı: ${email}`,
        'AuthService.login',
        __filename,
        126,
        { duration, uid: result.user.uid }
      );
      
      // ID token al
      const idToken = await result.user.getIdToken();
      this.logger.debug(
        'Firebase ID token alındı',
        'AuthService.login',
        __filename,
        135
      );

      // Backend'e giriş için API çağrısı yap
      this.logger.debug(
        'Backend login isteği gönderiliyor',
        'AuthService.login',
        __filename,
        141
      );
      
      const response = await apiService.post<AuthResponse>("/auth/login-via-idtoken", {
        idToken,
      });

      this.logger.info(
        'Backend login başarılı',
        'AuthService.login',
        __filename,
        149,
        { userId: response.user.id }
      );

      // Token artık backend tarafından HttpOnly cookie olarak yönetiliyor
      // localStorage kullanımını kaldırıyoruz

      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      this.logger.error(
        'Giriş hatası',
        'AuthService.login',
        __filename,
        166,
        { error: this.formatFirebaseError(error) }
      );
      
      // Hata tipini kontrol et ve daha detaylı logla
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        this.logger.error(
          'API Hatası',
          'AuthService.login',
          __filename,
          176,
          { 
            code: axiosError.code, 
            response: axiosError.response?.data,
            url: axiosError.config?.url, 
            method: axiosError.config?.method 
          }
        );
      }
      
      throw error;
    }
  }

  /**
   * Google ile giriş
   * @param idToken Firebase'den alınan ID token
   * @returns Giriş yanıtı
   */
  async loginWithGoogle(idToken?: string): Promise<GoogleAuthResponse> {
    try {
      trackFlow(
        'Google ile giriş başlatıldı',
        'AuthService.loginWithGoogle',
        FlowCategory.Auth
      );
      
      // idToken parametresi verilmediyse, Google popup ile giriş yap
      if (!idToken) {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        idToken = await result.user.getIdToken();
      }
      
      // Backend'e giriş için API çağrısı yap
      const response = await apiService.post<GoogleAuthResponse>("/auth/login-via-google", {
        idToken,
      });
      
      this.logger.info(
        'Google ile giriş başarılı',
        'AuthService.loginWithGoogle',
        __filename,
        228,
        { userId: response.user.id, isNewUser: response.isNewUser }
      );
      
      // User tipini dönüştür
      return {
        ...response,
        user: adaptUserFromBackend(response.user),
      };
    } catch (error: unknown) {
      this.logger.error(
        'Google ile giriş hatası',
        'AuthService.loginWithGoogle',
        __filename,
        242,
        { error: this.formatFirebaseError(error) }
      );
      throw error;
    }
  }

  /**
   * Çıkış yap
   * @returns Çıkış işlemi başarılı olup olmadığı
   */
  async signOut(): Promise<void> {
    try {
      trackFlow(
        'Kullanıcı çıkışı başlatıldı',
        'AuthService.signOut',
        FlowCategory.Auth
      );
      this.flowTracker.markStart('logout');
      
      this.logger.info(
        'Kullanıcı çıkışı yapılıyor',
        'AuthService.signOut',
        __filename,
        246
      );
      
      // Backend'e çıkış isteği yaparak cookie'yi temizle
      await apiService.post('/auth/logout', {});
      
      // Ardından Firebase'den çıkış yap
      await firebaseSignOut(auth);

      // localStorage'dan token'ı temizle - cookie tamamen kaldırıldı, ancak localStorage'da varsa temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem("auth_token");
        removeAuthCookie();
      }
      
      // Çıkış işlemi başarılı
      const duration = this.flowTracker.markEnd('logout', mapToTrackerCategory(FlowCategory.Auth), 'AuthService.signOut');
      this.logger.info(
        'Kullanıcı çıkışı tamamlandı',
        'AuthService.signOut',
        __filename,
        266,
        { duration }
      );
      
      return;
    } catch (error) {
      this.logger.error(
        'Çıkış hatası',
        'AuthService.signOut',
        __filename,
        274,
        { error: this.formatFirebaseError(error) }
      );
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
      
      const response = await apiService.post<{success: boolean, token: string, expiresIn?: number}>(
        "/auth/refresh-token", 
        {}, 
        {
          withCredentials: true, // HTTP-only cookie'lerin gönderilmesi için gerekli
        }
      );
      
      // Yeni token'ı döndür
      if (response && response.token) {
        console.log("✅ Token başarıyla yenilendi");
        
        // Yeni token'ı localStorage ve cookie'ye kaydet
        localStorage.setItem("auth_token", response.token);
        setAuthCookie(response.token);
        
        return { token: response.token };
      } else {
        console.error("❌ Refresh token yanıtında token bulunamadı:", response);
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

  /**
   * Hata mesajlarını formatlar - Firebase ve diğer hatalar için tutarlı bir format sağlar
   * @param error Hata nesnesi
   * @returns Formatlanmış hata mesajı
   */
  formatAuthError(error: unknown): string {
    if (error instanceof FirebaseError) {
      return this.formatFirebaseError(error).message;
    } else if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return `API hatası: ${axiosError.response?.statusText || axiosError.message}`;
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'Bilinmeyen bir hata oluştu';
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
    // Firebase hata kodlarına göre kullanıcı dostu Türkçe mesajlar
    switch (code) {
      // Kimlik doğrulama hataları
      case 'auth/user-not-found':
        return 'Bu e-posta adresine sahip bir kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Hatalı şifre girdiniz';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta formatı';
      case 'auth/invalid-credential':
        return 'Geçersiz kimlik bilgileri. Lütfen e-posta ve şifrenizi kontrol edin';
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda';
      case 'auth/weak-password':
        return 'Şifre çok zayıf. En az 6 karakter uzunluğunda bir şifre kullanın';
      case 'auth/too-many-requests':
        return 'Çok fazla başarısız giriş nedeniyle hesabınız geçici olarak engellendi. Lütfen daha sonra tekrar deneyin veya şifrenizi sıfırlayın';
      case 'auth/popup-closed-by-user':
        return 'Giriş işlemi iptal edildi';
      case 'auth/network-request-failed':
        return 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin';
      case 'auth/operation-not-allowed':
        return 'Bu giriş yöntemi etkin değil';
      case 'auth/requires-recent-login':
        return 'Bu işlem hassas bir işlem olduğu için yeniden giriş yapmanız gerekiyor';
      case 'auth/account-exists-with-different-credential':
        return 'Bu e-posta adresi farklı bir giriş yöntemi ile zaten kullanılıyor';
      case 'auth/user-disabled':
        return 'Bu kullanıcı hesabı yönetici tarafından devre dışı bırakılmıştır';
      case 'auth/timeout':
        return 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin';
      case 'auth/invalid-login-credentials':
        return 'Giriş bilgileri hatalı. Lütfen e-posta ve şifrenizi kontrol edin';
      case 'auth/missing-password':
        return 'Lütfen şifrenizi girin';
      case 'auth/missing-email':
        return 'Lütfen e-posta adresinizi girin';
      
      // Genel/diğer hatalar
      default:
        console.warn(`Tanımlanmamış Firebase hata kodu: ${code}`);
        return `Kimlik doğrulama hatası: ${code}`;
    }
  }
}

// Singleton instance oluştur ve export et
const authService = new AuthService();
export default authService;
export { authService as AuthService };
