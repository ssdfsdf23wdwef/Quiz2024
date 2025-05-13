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
import authService from "@/services/auth.service";
import { User } from "@/types";
import { 
  User as FirebaseUser, 
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { useAuthStore, AuthState } from "@/store/auth.store";
import { auth } from "@/app/firebase/config";
import axios, { AxiosError } from "axios";
import { getLogger, getFlowTracker, FlowCategory, trackFlow } from "@/lib/logger.utils";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";

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
  user: User | null; // Giriş yapmış kullanıcı bilgisi
  isAuthenticated: boolean; // Kullanıcının giriş yapmış olup olmadığı
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
  user: null,
  isAuthenticated: false,
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

/**
 * AuthContext oturum açma/kapatma işlemlerini ve kullanıcı durumunu yönetir
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  // State yönetimi - sadece yerel durumlar için
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Zustand Store'dan kullanıcı durumunu alalım
  const user = useAuthStore((state: AuthState) => state.user);
  const isAuthenticated = useAuthStore((state: AuthState) => state.isAuthenticated);

  // Zustand Store'dan doğrudan ve doğru şekilde fonksiyonları al
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const setFirebaseUser = useAuthStore((state: AuthState) => state.setFirebaseUser);
  const setLoading = useAuthStore((state: AuthState) => state.setLoading);
  const logoutUser = useAuthStore((state: AuthState) => state.logoutUser);

  // Auth değişikliklerini izleme
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
        trackFlow(
          firebaseUser ? 'Kullanıcı oturumu açık' : 'Kullanıcı oturumu değişikliği algılandı', 
          'AuthContext.onAuthStateChange',
          FlowCategory.Auth,
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
            
            trackFlow(
              'Profil bilgileri isteniyor', 
              'AuthContext.onAuthStateChange',
              FlowCategory.API
            );
            
            const userProfile = await authService.getProfile();
            
            logger.info(
              `Profil bilgileri alındı: ${userProfile.email}`,
              'AuthContext.onAuthStateChange',
              'AuthContext.tsx',
              299,
              { userId: userProfile.id }
            );
            
            // Zustand store'a kullanıcı bilgilerini ayarla
            setUser(userProfile);

            // Yükleme durumları güncelleme
            setIsInitializing(false);
            setLoading(false);
            setAuthError(null);
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
              
              // Backend bağlantı hatası durumunda
              if (axiosError.code === 'ECONNABORTED' || 
                  axiosError.code === 'ECONNREFUSED' || 
                  axiosError.code === 'ERR_NETWORK') {
                handleConnectionError(firebaseUser);
              } 
              // Yetkilendirme hatası durumunda oturumu kapat
              else if (axiosError.response?.status === 401) {
                handleUnauthorizedError();
              }
              // Diğer API hataları 
              else {
                logger.error(
                  `API hatası: ${axiosError.response?.status}`,
                  'AuthContext.onAuthStateChange',
                  'AuthContext.tsx',
                  330,
                  { error: axiosError.response?.data }
                );

                setUser(null);
                setAuthError(`API hatası: ${axiosError.response?.statusText || 'Bilinmeyen hata'}`);
              }
            } else {
              // Diğer hatalar
              logger.error(
                'Beklenmeyen bir hata oluştu',
                'AuthContext.onAuthStateChange',
                'AuthContext.tsx',
                341,
                { error }
              );
              
              setUser(null);
              setAuthError('Oturum bilgileri alınırken beklenmeyen bir hata oluştu.');
            }
            
            setIsInitializing(false);
            setLoading(false);
          }
        } else {
          // Kullanıcı oturumu kapalı
          logoutUser();
          setIsInitializing(false);
          setLoading(false);
          setAuthError(null);
          
          logger.info(
            'Kullanıcı oturumu kapalı',
            'AuthContext.onAuthStateChange',
            'AuthContext.tsx',
            360
          );
        }
      } catch (error) {
        logger.error(
          'Oturum durumu değişikliği işlenirken hata oluştu',
          'AuthContext.onAuthStateChange',
          'AuthContext.tsx',
          367,
          { error }
        );
        
        setIsInitializing(false);
        setLoading(false);
        setAuthError('Oturum durumu değişikliği işlenirken bir hata oluştu.');
      }
    });
    
    // Temizleme fonksiyonu
    return () => {
      flowTracker.endSequence(seqId);
      unsubscribe();
    };
  }, []);

  // Bağlantı hataları için yardımcı fonksiyon
  const handleConnectionError = (firebaseUser: FirebaseUser) => {
    logger.warn(
      'Backend bağlantı hatası - minimum kullanıcı bilgileri ile devam ediliyor',
      'AuthContext.handleConnectionError',
      'AuthContext.tsx',
      388
    );
    
    // Offline modda - Firebase kullanıcı bilgilerinden minimum bir kullanıcı profili oluştur
    const minimalUserProfile: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      firstName: firebaseUser.displayName?.split(' ')[0] || '',
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      profileImageUrl: firebaseUser.photoURL || '',
      role: 'user',
      onboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setUser(minimalUserProfile);
    setAuthError('Sunucu bağlantısı kurulamadı. Çevrimdışı modda sınırlı işlemler yapabilirsiniz.');
    
    trackFlow(
      'Backend bağlantı hatası - offline mod etkin', 
      'AuthContext.handleConnectionError',
      FlowCategory.Error
    );
  };

  // Yetkisiz erişim hataları için yardımcı fonksiyon
  const handleUnauthorizedError = async () => {
    logger.warn(
      'API 401 hatası - Firebase oturumu geçersiz',
      'AuthContext.handleUnauthorizedError',
      'AuthContext.tsx',
      418
    );
    
    // Firebase kullanıcısını kontrol et
    const currentUser = auth.currentUser;
    
    // Eğer kullanıcı firebase'de hala giriş yapmış ama backend'de 401 alıyorsak
    // token yenilemeyi deneyelim
    if (currentUser) {
      logger.info(
        'Firebase kullanıcısı mevcut, token yenileme deneniyor',
        'AuthContext.handleUnauthorizedError',
        'AuthContext.tsx',
        430
      );
      
      try {
        // Yeni token iste ve backend'e göndermeyi dene
        const newToken = await currentUser.getIdToken(true);
        
        // Token yenileme dene
        logger.debug(
          'Firebase token yenilendi, backend ile doğrulama deneniyor',
          'AuthContext.handleUnauthorizedError',
          'AuthContext.tsx',
          440
        );
        
        try {
          // Yeni token ile backend'de doğrulama dene
          const response = await authService.loginWithIdToken(newToken);
          
          // Başarılı ise kullanıcıyı güncelle
          setUser(response.user);
          setAuthError(null);
          
          logger.info(
            'Token yenileme başarılı, oturum devam ediyor',
            'AuthContext.handleUnauthorizedError',
            'AuthContext.tsx',
            452
          );
          
          trackFlow(
            'Token yenileme başarılı - oturum kurtarıldı',
            'AuthContext.handleUnauthorizedError',
            FlowCategory.Auth
          );
          
          return; // Başarılı ise fonksiyondan çık
        } catch (refreshError) {
          logger.error(
            'Token yenileme başarısız, oturum kapatılıyor',
            'AuthContext.handleUnauthorizedError',
            'AuthContext.tsx',
            466,
            { error: refreshError }
          );
        }
      } catch (tokenError) {
        logger.error(
          'Yeni token alınamadı',
          'AuthContext.handleUnauthorizedError',
          'AuthContext.tsx',
          474,
          { error: tokenError }
        );
      }
    }
    
    // Token yenileme başarısız olduysa veya Firebase kullanıcısı yoksa
    // normal oturum kapatma işlemine devam et
    try {
      await authService.signOut();
    } catch (error) {
      logger.error(
        'Oturum kapatılırken hata oluştu',
        'AuthContext.handleUnauthorizedError',
        'AuthContext.tsx',
        488,
        { error }
      );
    }
    
    logoutUser();
    setAuthError('Oturumunuz sona erdi, lütfen tekrar giriş yapın.');
    
    trackFlow(
      '401 hatası - oturum sonlandırıldı', 
      'AuthContext.handleUnauthorizedError',
      FlowCategory.Auth
    );
  };

  // Oturum durumunu kontrol et
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!isBrowser) return false;
      
      if (!auth.currentUser) return false;
      
      // Profil bilgilerini getirerek oturumun geçerli olup olmadığını kontrol et
      await authService.getProfile();
      return true;
    } catch (error) {
      trackFlow('Oturum kontrolü hatası', 'AuthContext.checkSession', FlowCategory.Error, { error });
      logger.error('Oturum kontrolü hatası', 'AuthContext.checkSession', 'AuthContext.tsx', 330, { error });
      
      // 401 hatası alındıysa
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Oturumu kapat
        await handleUnauthorizedError();
        return false;
      }
      
      // Bağlantı hatası durumunda (offline), mevcut durumu koru (true dönebilir)
      if (axios.isAxiosError(error) && 
          (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK')) {
        trackFlow('Oturum kontrolü bağlantı hatası (offline?)', 'AuthContext.checkSession', FlowCategory.Error);
        return true; // Kullanıcı hala oturum açık sayılabilir
      }
      
      return false;
    } finally {
      setAuthError(null);
    }
  }, []);

  // E-posta ve şifre ile giriş
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    logger.debug(`Login isteği başlatıldı: ${email}`, 'AuthContext.login', 'AuthContext.tsx', 160);
    setAuthError(null);
    setLoading(true);
    
    try {
      trackFlow('Firebase ile giriş yapılıyor', 'AuthContext.login', FlowCategory.Auth);
      
      // Firebase ile giriş
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      trackFlow('Backend ile ID token doğrulanıyor', 'AuthContext.login', FlowCategory.Auth);
      
      // Kimlik doğrulandıktan sonra backend'e token gönder
      const idToken = await userCredential.user.getIdToken();
      const backendResponse = await authService.loginWithIdToken(idToken);
      
      trackFlow('Backend doğrulaması başarılı', 'AuthContext.login', FlowCategory.Auth);
      
      logger.info(
        `Backend doğrulaması başarılı: ${backendResponse.user.email}`,
        'AuthContext.login',
        'AuthContext.tsx',
        180,
        { userId: backendResponse.user.id }
      );
      
      setUser(backendResponse.user);
      return backendResponse;
    } catch (error: unknown) { 
      // Hata detaylarını ayrıştır
      let errorMessage: string;

      // FirebaseError tipinde hata gelirse, detaylı ayrıştırma yapalım
      if (error instanceof FirebaseError) {
        errorMessage = authService.formatAuthError(error);
        
        // Detaylı hata logu
        logger.error(
          `Firebase login hatası: ${error.code}`, 
          'AuthContext.login', 
          'AuthContext.tsx', 
          187, 
          { 
            errorCode: error.code,
            errorMessage: errorMessage, 
            email,
            originalError: error.message
          }
        );
      } else if (axios.isAxiosError(error)) {
        // API hatalarını detaylı logla
        const axiosError = error as AxiosError;
        errorMessage = authService.formatAuthError(error);
        
        logger.error(
          `API login hatası: ${axiosError.response?.status}`, 
          'AuthContext.login', 
          'AuthContext.tsx', 
          199, 
          { 
            statusCode: axiosError.response?.status, 
            statusText: axiosError.response?.statusText,
            url: axiosError.config?.url,
            errorData: axiosError.response?.data,
            email
          }
        );
      } else {
        // Diğer hata tipleri için genel işleme
        errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
        
        logger.error(
          'Login hatası', 
          'AuthContext.login', 
          'AuthContext.tsx', 
          213, 
          { error: errorMessage, email }
        );
      }
      
      trackFlow('Giriş hatası', 'AuthContext.login', FlowCategory.Error, { errorMessage });
      setAuthError(errorMessage);
      throw error instanceof Error ? error : new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Google ile giriş
  const loginWithGoogle = useCallback(async (): Promise<GoogleAuthResponse> => {
    logger.debug('Google ile login isteği başlatıldı', 'AuthContext.loginWithGoogle', 'AuthContext.tsx', 276);
    setAuthError(null);
    setLoading(true);
    
    try {
      trackFlow('Google popup açılıyor', 'AuthContext.loginWithGoogle', FlowCategory.Auth);
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      trackFlow('Backend\'e ID token gönderiliyor', 'AuthContext.loginWithGoogle', FlowCategory.Auth);
      
      // Backend ile doğrula ve kullanıcıyı al/oluştur
      const idToken = await result.user.getIdToken();
      const backendUser = await authService.loginWithGoogle(idToken);
      
      trackFlow('Google ile giriş backend doğrulaması başarılı', 'AuthContext.loginWithGoogle', FlowCategory.Auth);
      
      logger.info(
        `Google ile giriş backend doğrulaması başarılı: ${backendUser.user.email}`,
        'AuthContext.loginWithGoogle',
        'AuthContext.tsx',
        296,
        { userId: backendUser.user.id, isNewUser: backendUser.isNewUser }
      );
      
      setUser(backendUser.user);
      return backendUser;
    } catch (error: unknown) {
      const errorMessage = authService.formatAuthError(error);
      trackFlow('Google ile giriş hatası', 'AuthContext.loginWithGoogle', FlowCategory.Error, { error: errorMessage });
      
      // FirebaseError tipini kullanarak daha güvenli kontrol yap
      if (error instanceof FirebaseError && error.code === 'auth/popup-closed-by-user') {
        logger.warn('Google login popup kullanıcı tarafından kapatıldı', 'AuthContext.loginWithGoogle', 'AuthContext.tsx', 307);
        setAuthError("Google ile giriş iptal edildi.");
        throw new Error("Google ile giriş iptal edildi."); // Hata fırlat
      } else {
        logger.error(
          'Google login hatası', 
          'AuthContext.loginWithGoogle', 
          'AuthContext.tsx', 
          311, 
          { error: error instanceof Error ? error.message : String(error) }
        );
        setAuthError(errorMessage);
        throw new Error(errorMessage); // Diğer hataları fırlat
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Oturumu kapat
  const signOut = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      
      logger.info(
        'Oturum kapatma başlatılıyor',
        'AuthContext.signOut',
        'AuthContext.tsx',
        551
      );
      
      // AuthService üzerinden oturumu kapat
      await authService.signOut();
      
      // Store durumunu temizle
      logoutUser();
      
      trackFlow('SignOut başarılı', 'AuthContext.signOut', FlowCategory.Auth);
      return true;
    } catch (error) {
      // mapFirebaseAuthError yerine genel hata mesajı
      const errorMessage = error instanceof Error ? error.message : 'Oturum kapatılırken bilinmeyen bir hata oluştu';
      trackFlow('SignOut hatası', 'AuthContext.signOut', FlowCategory.Error, { error });
      logger.error('SignOut hatası', 'AuthContext.signOut', 'AuthContext.tsx', 452, { error });
      // Hata olsa bile store'u temizlemeyi dene (onAuthStateChanged tetiklenmeyebilir)
      logoutUser(); 
      setAuthError(errorMessage);
      return false;
    } finally {
      setLoading(false);
      setAuthError(null);
    }
  }, []);

  // Profil güncelleme
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<User> => {
    try {
      setLoading(true);
      
      logger.info(
        'Profil güncelleme başlatılıyor',
        'AuthContext.updateProfile',
        'AuthContext.tsx',
        587
      );
      
      // AuthService üzerinden profil güncelleme
      const updatedUser = await authService.updateProfile(profileData);
      
      // Güncel kullanıcı bilgilerini store'a kaydet
      setUser(updatedUser);
      
      trackFlow('UpdateProfile başarılı', 'AuthContext.updateProfile', FlowCategory.User, { userId: updatedUser.id });
      return updatedUser;
    } catch (error) {
      // mapFirebaseAuthError yerine genel hata mesajı
      const errorMessage = error instanceof Error ? error.message : 'Profil güncellenirken bilinmeyen bir hata oluştu';
      trackFlow('UpdateProfile hatası', 'AuthContext.updateProfile', FlowCategory.Error, { error });
      logger.error('UpdateProfile hatası', 'AuthContext.updateProfile', 'AuthContext.tsx', 485, { error });
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Şifre sıfırlama
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      logger.info(
        'Şifre sıfırlama başlatılıyor',
        'AuthContext.resetPassword',
        'AuthContext.tsx',
        624,
        { email }
      );
      
      // Firebase şifre sıfırlama e-postası gönder
      await sendPasswordResetEmail(auth, email);
      
      logger.info(
        'Şifre sıfırlama e-postası gönderildi',
        'AuthContext.resetPassword',
        'AuthContext.tsx',
        633,
        { email }
      );
      
      return true;
    } catch (error) {
      // mapFirebaseAuthError yerine genel hata mesajı
      const errorMessage = error instanceof Error ? error.message : 'Şifre sıfırlama sırasında bilinmeyen bir hata oluştu';
      trackFlow('ResetPassword hatası', 'AuthContext.resetPassword', FlowCategory.Error, { error, email });
      logger.error('ResetPassword hatası', 'AuthContext.resetPassword', 'AuthContext.tsx', 510, { error, email });
      setAuthError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Context değerini oluştur
  const value = useMemo(
    () => ({
      isInitializing,
      authError,
      user,
      isAuthenticated,
      login,
      register: async (
        email: string, 
        password: string, 
        userData: { firstName?: string; lastName?: string }
      ) => {
        try {
          setLoading(true);
          setAuthError(null);
          
          trackFlow('Kayıt işlemi başlatılıyor', 'AuthContext.register', FlowCategory.Auth);
          
          const response = await authService.register(email, password, userData);
          setUser(response.user);
          
          trackFlow('Kayıt işlemi başarılı', 'AuthContext.register', FlowCategory.Auth);
          
          // Başarılı kayıt sonrası ana sayfaya yönlendir
          logger.info('Kayıt başarılı, ana sayfaya yönlendiriliyor', 'AuthContext.register', 'AuthContext.tsx', 600);
          router.push('/');
          
          return response;
        } catch (error) {
          const errorMessage = authService.formatAuthError(error);
          setAuthError(errorMessage);
          trackFlow('Kayıt hatası', 'AuthContext.register', FlowCategory.Error, { error: errorMessage });
          throw error;
        } finally {
          setLoading(false);
        }
      },
      loginWithGoogle,
      signOut,
      updateProfile,
      checkSession,
      resetPassword,
    }),
    [
      isInitializing,
      authError,
      user,
      isAuthenticated,
      login,
      loginWithGoogle,
      signOut,
      updateProfile,
      checkSession,
      resetPassword,
      router,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
