"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";
import { User } from "@/types";
import { User as FirebaseUser, sendPasswordResetEmail } from "firebase/auth";
import { useAuthStore } from "@/store/auth.store";
import { auth } from "@/app/firebase/config";
import axios, { AxiosError } from "axios";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// Tarayıcı ortamı kontrolü
const isBrowser = typeof window !== 'undefined';

// API yanıt tipleri
interface AuthResponse {
  user: User;
  token?: string; // Artık token'ı client tarafında saklamıyoruz, backend HttpOnly cookie olarak yönetiyor
}

interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

// Context için tip tanımı - Firebase etkileşimleri ve kimlik doğrulama işlemleri için
interface AuthContextType {
  isInitializing: boolean; // Auth başlatılma durumu
  authError: string | null; // Kimlik doğrulama hatası
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string,
    password: string,
    userData: { firstName?: string; lastName?: string },
  ) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<GoogleAuthResponse>;
  signOut: () => Promise<boolean>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  checkSession: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>; // Şifre sıfırlama fonksiyonu tipi
}

// Başlangıç değerleri
const initialState = {
  isInitializing: true,
  authError: null,
};

// Context oluşturma
const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  register: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  loginWithGoogle: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  signOut: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  updateProfile: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  checkSession: async () => {
    throw new Error("Context provider yüklenmedi");
  },
  resetPassword: async () => {
    throw new Error("Context provider yüklenmedi");
  },
});

// Hook
export const useAuth = () => useContext(AuthContext);

// Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State yönetimi - sadece yerel durumlar için
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  
  // Uygulamanın client-side render edildiğinden emin olarak hook kullanımı
  // Hook'ları koşulsuz bir şekilde en üst seviyede çağır
  const store = useAuthStore();
  
  // Store fonksiyonlarına güvenli erişim
  const setUser = useCallback((user: User | null) => {
    if (isBrowser) {
      // Doğrudan store'dan method çağırma
      store.getState().setUser(user);
    }
  }, [store]);
  
  const setFirebaseUser = useCallback((user: FirebaseUser | null) => {
    if (isBrowser) {
      store.getState().setFirebaseUser(user);
    }
  }, [store]);
  
  const setLoading = useCallback((loading: boolean) => {
    if (isBrowser) {
      store.getState().setLoading(loading);
    }
  }, [store]);
  
  const logoutUser = useCallback(() => {
    if (isBrowser) {
      store.getState().logoutUser();
    }
  }, [store]);

  // Oturum durumunu izle
  useEffect(() => {
    // SSR sırasında çalıştırma
    if (!isBrowser) {
      return;
    }

    const seqId = flowTracker.startSequence('AuthStateMonitoring');
    
    logger.info(
      'Oturum durumu izleme başlatıldı',
      'AuthContext.onAuthStateChange',
      'AuthContext.tsx',
      264
    );
    
    // Yükleniyor durumunu ayarla
    setIsInitializing(true);
    setLoading(true);
    
    // Sunucu tarafında işlem yapma
    if (!auth) {
      logger.warn(
        'Firebase auth nesnesi bulunamadı',
        'AuthContext.onAuthStateChange',
        'AuthContext.tsx',
        275
      );
      setIsInitializing(false);
      setLoading(false);
      return;
    }
    
    // Firebase Auth durumunu dinle
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      try {
        // Firebase durumunu izleme
        flowTracker.trackStep(
          'Auth', 
          firebaseUser ? 'Kullanıcı oturumu açık' : 'Kullanıcı oturumu değişikliği algılandı', 
          'AuthContext.onAuthStateChange',
          firebaseUser ? { email: firebaseUser.email } : undefined
        );
        
        // Firebase kullanıcı durumunu Zustand'a kaydet
        setFirebaseUser(firebaseUser);
        
        if (firebaseUser) {
          try {
            // Firebase kullanıcısı varsa, profil bilgilerini al
            logger.debug(
              `Profil bilgileri isteniyor: ${firebaseUser.email}`,
              'AuthContext.onAuthStateChange',
              'AuthContext.tsx',
              287
            );
            
            flowTracker.trackStep(
              'API', 
              'Profil bilgileri isteniyor', 
              'AuthContext.onAuthStateChange'
            );
            
            const userProfile = await authService.getProfile();
            
            logger.info(
              `Profil bilgileri alındı: ${userProfile.email}`,
              'AuthContext.onAuthStateChange',
              'AuthContext.tsx',
              299,
              { userId: userProfile.id }
            );
            
            // Zustand store'u güncelle
            setUser(userProfile);
          } catch (error) {
            logger.error(
              'Profil bilgileri alınamadı',
              'AuthContext.onAuthStateChange',
              'AuthContext.tsx',
              309,
              { error }
            );
            
            // API hatası ise ve bağlantı hatası varsa
            if (axios.isAxiosError(error)) {
              const axiosError = error as AxiosError;
              if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ERR_NETWORK') {
                logger.warn(
                  `Backend bağlantı hatası: ${axiosError.code}`,
                  'AuthContext.onAuthStateChange',
                  'AuthContext.tsx',
                  320
                );
                
                flowTracker.trackStep(
                  'API', 
                  'Backend bağlantı hatası - oturum korunuyor', 
                  'AuthContext.onAuthStateChange',
                  { errorCode: axiosError.code }
                );
                
                // Offline modda kullanıcı bilgilerini korumak için token'ı localStorage'dan kontrol et
                const token = localStorage.getItem("auth_token");
                if (!token) {
                  // Token yoksa ve offline modda ise, en azından firebase kullanıcısını koru
                  // Burada tam logout yapmıyoruz, sadece API'den gelen bilgileri temizliyoruz
                  logger.warn('Token bulunamadı, ancak Firebase kullanıcısı korunuyor', 'AuthContext', 'AuthContext.tsx', 338);
                }
              } else {
                // Diğer API hatalarında durumu değerlendir
                if (axiosError.response?.status === 401) {
                  logger.warn(
                    'API 401 hatası - Firebase oturumu geçersiz',
                    'AuthContext.onAuthStateChange',
                    'AuthContext.tsx',
                    346
                  );
                  
                  // 401 hatası, oturumun backend tarafında geçersiz olduğunu gösterir
                  await authService.signOut();
                  logoutUser();
                } else {
                  // Diğer API hatalarında sadece log tut, oturumu sonlandırma
                  logger.warn(
                    `API ${axiosError.response?.status || 'bilinmeyen'} hatası - oturum korunuyor`,
                    'AuthContext.onAuthStateChange',
                    'AuthContext.tsx',
                    356
                  );
                }
              }
            } else {
              // Kritik hata değilse oturumu korumaya çalış
              logger.warn(
                'API hatası nedeniyle profil bilgileri alınamadı, ancak Firebase oturumu korunuyor',
                'AuthContext.onAuthStateChange',
                'AuthContext.tsx',
                365
              );
            }
          }
        } else if (firebaseUser === null) {
          // Kullanıcı bilinçli olarak oturumu kapattıysa (null)
          logger.debug(
            'Firebase tarafından kullanıcı oturumu kapalı olarak bildirildi',
            'AuthContext.onAuthStateChange',
            'AuthContext.tsx',
            374
          );
          
          // Kullanıcı açık bir şekilde oturumu kapattıysa Zustand durumunu temizle
          logoutUser();
        }
      } catch (error) {
        // onAuthStateChange içindeki ana hatalar
        logger.error(
          'Oturum değişikliği işlenirken hata',
          'AuthContext.onAuthStateChange',
          'AuthContext.tsx',
          385,
          { error }
        );
        
        // Kritik bir hata durumunda kullanıcı durumunu sıfırla
        logoutUser();
      } finally {
        // Başlatma işlemi tamamlandı
        setIsInitializing(false);
        setLoading(false);
        
        logger.debug(
          'Auth durumu başlatma tamamlandı',
          'AuthContext.onAuthStateChange',
          'AuthContext.tsx',
          398
        );
      }
    });

    // Temizleme fonksiyonu
    return () => {
      logger.debug(
        'Oturum izleyici temizleniyor',
        'AuthContext.onAuthStateChange',
        'AuthContext.tsx',
        407
      );
      
      unsubscribe();
      flowTracker.endSequence(seqId);
    };
  }, [setFirebaseUser, setUser, setLoading, logoutUser]);

  // Oturum durumunu kontrol et
  const checkSession = useCallback(async (): Promise<boolean> => {
    const seqId = flowTracker.startSequence('CheckSession');
    
    logger.debug(
      'Oturum kontrolü yapılıyor',
      'AuthContext.checkSession',
      'AuthContext.tsx',
      60
    );
    
    try {
      // Mevcut kullanıcı var mı kontrol et
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        logger.debug(
          'Aktif oturum bulunamadı',
          'AuthContext.checkSession',
          'AuthContext.tsx',
          71
        );
        flowTracker.endSequence(seqId);
        return false;
      }
      
      flowTracker.trackStep(
        'Auth', 
        'Kullanıcı oturumu kontrolü başarılı', 
        'AuthContext.checkSession',
        { email: currentUser.email }
      );

      // Profil bilgilerini al - HttpOnly cookie sayesinde backend'e authentication yapılacak
      const userProfile = await authService.getProfile();
      
      flowTracker.trackStep(
        'Auth', 
        'Kullanıcı profili alındı', 
        'AuthContext.checkSession'
      );

      // Zustand store'u güncelle
      setUser(userProfile);
      setFirebaseUser(currentUser);
      setLoading(false);
      
      logger.info(
        `Oturum kontrolü başarılı: ${userProfile.email}`,
        'AuthContext.checkSession',
        'AuthContext.tsx',
        97,
        { userId: userProfile.id }
      );

      flowTracker.endSequence(seqId);
      return true;
    } catch (error) {
      logger.error(
        'Oturum kontrolü hatası',
        'AuthContext.checkSession',
        'AuthContext.tsx',
        107,
        { error }
      );

      // Hata durumunda oturumu kapat
      await authService.signOut();
      logoutUser();
      
      flowTracker.trackStep(
        'Auth', 
        'Oturum kontrolü hatası - kullanıcı çıkış yapıldı', 
        'AuthContext.checkSession',
        { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );

      flowTracker.endSequence(seqId);
      return false;
    }
  }, [setUser, setFirebaseUser, setLoading, logoutUser]);

  // Çıkış fonksiyonu
  const signOut = useCallback(async () => {
    const seqId = flowTracker.startSequence('UserSignOut');
    
    logger.info(
      'Kullanıcı çıkışı başlatıldı',
      'AuthContext.signOut',
      'AuthContext.tsx',
      134
    );
    
    try {
      await authService.signOut();
      
      // Zustand store'daki kullanıcı bilgilerini temizle
      logoutUser();
      
      flowTracker.trackStep('Navigation', 'Giriş sayfasına yönlendiriliyor', 'AuthContext.signOut');
      router.push("/auth/login");
      
      logger.info(
        'Kullanıcı çıkışı başarılı',
        'AuthContext.signOut',
        'AuthContext.tsx',
        149
      );
      
      flowTracker.endSequence(seqId);
      return true;
    } catch (error) {
      logger.error(
        'Çıkış yapılırken hata oluştu',
        'AuthContext.signOut',
        'AuthContext.tsx',
        158,
        { error }
      );
      
      setAuthError("Çıkış yapılırken bir hata oluştu.");
      
      flowTracker.trackStep(
        'Auth', 
        'Çıkış hatası', 
        'AuthContext.signOut',
        { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      flowTracker.endSequence(seqId);
      throw error;
    }
  }, [router, logoutUser]);

  // Şifre sıfırlama fonksiyonu
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    const seqId = flowTracker.startSequence('PasswordReset');
    
    logger.info(
      `Şifre sıfırlama başlatıldı: ${email}`,
      'AuthContext.resetPassword',
      'AuthContext.tsx',
      184
    );
    
    try {
      setAuthError(null);
      
      if (!email || !email.includes("@")) {
        const errorMessage = "Geçerli bir email adresi girmelisiniz.";
        setAuthError(errorMessage);
        
        logger.warn(
          `Geçersiz e-posta adresi ile şifre sıfırlama denemesi: ${email}`,
          'AuthContext.resetPassword',
          'AuthContext.tsx',
          196
        );
        
        flowTracker.trackStep(
          'Auth', 
          'Şifre sıfırlama - geçersiz e-posta', 
          'AuthContext.resetPassword',
          { email }
        );
        
        flowTracker.endSequence(seqId);
        return false;
      }
      
      flowTracker.trackStep(
        'Auth', 
        'Firebase şifre sıfırlama isteği gönderiliyor', 
        'AuthContext.resetPassword'
      );
      
      // Firebase'in şifre sıfırlama API'sini kullan
      await sendPasswordResetEmail(auth, email);
      
      logger.info(
        `Şifre sıfırlama e-postası gönderildi: ${email}`,
        'AuthContext.resetPassword',
        'AuthContext.tsx',
        219
      );
      
      flowTracker.trackStep(
        'Auth', 
        'Şifre sıfırlama e-postası gönderildi', 
        'AuthContext.resetPassword'
      );
      
      flowTracker.endSequence(seqId);
      return true;
    } catch (error) {
      const firebaseError = error as { code?: string };
      const errorMessage = firebaseError.code 
        ? `Şifre sıfırlama sırasında hata: ${firebaseError.code}`
        : "Şifre sıfırlama işlemi sırasında bir hata oluştu.";
      
      setAuthError(errorMessage);
      
      logger.error(
        `Şifre sıfırlama hatası: ${email}`,
        'AuthContext.resetPassword',
        'AuthContext.tsx',
        240,
        { email, error: firebaseError.code || 'unknown' }
      );
      
      flowTracker.trackStep(
        'Auth', 
        'Şifre sıfırlama hatası', 
        'AuthContext.resetPassword',
        { email, errorCode: firebaseError.code }
      );
      
      flowTracker.endSequence(seqId);
      return false;
    }
  }, []);

  // Login fonksiyonu
  const login = useCallback(async (email: string, password: string) => {
    const seqId = flowTracker.startSequence('UserLogin');
    
    logger.info(
      `Kullanıcı girişi başlatıldı: ${email}`,
      'AuthContext.login',
      'AuthContext.tsx',
      413
    );
    
    setAuthError(null);
    try {
      flowTracker.trackStep('Auth', 'Giriş isteği başlatıldı', 'AuthContext.login', { email });
      
      // AuthService üzerinden Firebase ile giriş yap
      const response = await authService.login(email, password);
      
      flowTracker.trackStep('Auth', 'Giriş başarılı', 'AuthContext.login');
      
      logger.info(
        `Kullanıcı girişi başarılı: ${email}`,
        'AuthContext.login',
        'AuthContext.tsx',
        426,
        { userId: response.user.id }
      );
      
      flowTracker.endSequence(seqId);
      return response;
    } catch (error) {
      logger.error(
        `Kullanıcı girişi başarısız: ${email}`,
        'AuthContext.login',
        'AuthContext.tsx',
        436,
        { error }
      );
      
      // Kullanıcı dostu hata mesajı
      setAuthError("Giriş yapılırken bir hata oluştu. Lütfen e-posta ve şifrenizi kontrol ediniz.");
      
      flowTracker.trackStep(
        'Auth', 
        'Giriş hatası', 
        'AuthContext.login',
        { email, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      flowTracker.endSequence(seqId);
      throw error;
    }
  }, []);

  // Register fonksiyonu
  const register = useCallback(async (
    email: string,
    password: string,
    userData: { firstName?: string; lastName?: string },
  ) => {
    const seqId = flowTracker.startSequence('UserRegistration');
    
    logger.info(
      `Kullanıcı kaydı başlatıldı: ${email}`,
      'AuthContext.register',
      'AuthContext.tsx',
      465
    );
    
    setAuthError(null);
    try {
      flowTracker.trackStep('Auth', 'Kayıt isteği başlatıldı', 'AuthContext.register', { email });
      
      // AuthService üzerinden kayıt işlemi
      const response = await authService.register(email, password, userData);
      
      flowTracker.trackStep('Auth', 'Kayıt başarılı', 'AuthContext.register');
      
      logger.info(
        `Kullanıcı kaydı başarılı: ${email}`,
        'AuthContext.register',
        'AuthContext.tsx',
        478,
        { userId: response.user.id }
      );
      
      flowTracker.endSequence(seqId);
      return response;
    } catch (error) {
      logger.error(
        `Kullanıcı kaydı başarısız: ${email}`,
        'AuthContext.register',
        'AuthContext.tsx',
        488,
        { error }
      );
      
      // Kullanıcı dostu hata mesajı
      setAuthError("Kayıt yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyiniz.");
      
      flowTracker.trackStep(
        'Auth', 
        'Kayıt hatası', 
        'AuthContext.register',
        { email, error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      flowTracker.endSequence(seqId);
      throw error;
    }
  }, []);

  // Google ile giriş fonksiyonu
  const loginWithGoogle = useCallback(async () => {
    const seqId = flowTracker.startSequence('GoogleLogin');
    
    logger.info(
      'Google ile giriş başlatıldı',
      'AuthContext.loginWithGoogle',
      'AuthContext.tsx',
      514
    );
    
    setAuthError(null);
    try {
      flowTracker.trackStep('Auth', 'Google giriş popup açılıyor', 'AuthContext.loginWithGoogle');
      
      // AuthService üzerinden Google ile giriş
      const response = await authService.loginWithGoogle();
      
      flowTracker.trackStep(
        'Auth', 
        'Google giriş başarılı', 
        'AuthContext.loginWithGoogle',
        { isNewUser: response.isNewUser }
      );
      
      logger.info(
        `Google ile giriş başarılı: ${response.user.email}`,
        'AuthContext.loginWithGoogle',
        'AuthContext.tsx',
        531,
        { 
          userId: response.user.id, 
          isNewUser: response.isNewUser
        }
      );
      
      flowTracker.endSequence(seqId);
      return response;
    } catch (error) {
      logger.error(
        'Google ile giriş başarısız',
        'AuthContext.loginWithGoogle',
        'AuthContext.tsx',
        544,
        { error }
      );
      
      // Kullanıcı dostu hata mesajı
      setAuthError("Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.");
      
      flowTracker.trackStep(
        'Auth', 
        'Google giriş hatası', 
        'AuthContext.loginWithGoogle',
        { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      flowTracker.endSequence(seqId);
      throw error;
    }
  }, []);

  // Profil güncelleme fonksiyonu
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    const seqId = flowTracker.startSequence('UpdateProfile');
    
    logger.info(
      'Profil güncellemesi başlatıldı',
      'AuthContext.updateProfile',
      'AuthContext.tsx',
      571,
      { updatedFields: Object.keys(profileData) }
    );
    
    setAuthError(null);
    try {
      flowTracker.trackStep(
        'API', 
        'Profil güncelleme isteği başlatıldı', 
        'AuthContext.updateProfile'
      );
      
      // AuthService üzerinden profil güncelleme
      const updatedProfile = await authService.updateProfile(profileData);
      
      flowTracker.trackStep(
        'Auth', 
        'Profil güncelleme başarılı', 
        'AuthContext.updateProfile'
      );
      
      logger.info(
        `Profil güncelleme başarılı: ${updatedProfile.email}`,
        'AuthContext.updateProfile',
        'AuthContext.tsx',
        591,
        { userId: updatedProfile.id }
      );
      
      flowTracker.endSequence(seqId);
      return updatedProfile;
    } catch (error) {
      logger.error(
        'Profil güncelleme başarısız',
        'AuthContext.updateProfile',
        'AuthContext.tsx',
        601,
        { error }
      );
      
      // Kullanıcı dostu hata mesajı
      setAuthError("Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyiniz.");
      
      flowTracker.trackStep(
        'Auth', 
        'Profil güncelleme hatası', 
        'AuthContext.updateProfile',
        { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      flowTracker.endSequence(seqId);
      throw error;
    }
  }, []);

  // Context provider değeri
  const contextValue = useMemo(
    () => ({
      isInitializing,
      authError,
      login,
      register,
      loginWithGoogle,
      signOut,
      updateProfile,
      checkSession,
      resetPassword,
    }),
    [
      isInitializing,
      authError,
      login,
      register,
      loginWithGoogle,
      signOut,
      updateProfile,
      checkSession,
      resetPassword,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
