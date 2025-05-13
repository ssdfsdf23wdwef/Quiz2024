// Bitirme_Kopya/frontend/src/app/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { 
  getAuth, Auth, connectAuthEmulator, 
  browserLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
import { getLogger, trackFlow } from "@/lib/logger.utils";
import { FlowCategory } from "@/constants/logging.constants";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();

// Firebase yapılandırma nesnesini çevresel değişkenlerden al
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Firebase yapılandırma tipi
type FirebaseConfigType = typeof firebaseConfig;

// Geliştirme için yedek Firebase yapılandırması
const FALLBACK_CONFIG: FirebaseConfigType = {
  apiKey: "AIzaSyC_3HCvaCSsLDvO0IJNmjXNvtNffalUl8Y",
  authDomain: "my-app-71530.firebaseapp.com",
  projectId: "my-app-71530",
  storageBucket: "my-app-71530.appspot.com",
  messagingSenderId: "29159149861",
  appId: "1:29159149861:web:5ca6583d1f45efcb6e0acc",
  measurementId: "G-CZNHMSMK8P",
  databaseURL: "https://my-app-71530-default-rtdb.firebaseio.com",
};

// Firebase yapılandırmasının geçerliliğini kontrol et
const validateFirebaseConfig = (): FirebaseConfigType => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'] as (keyof FirebaseConfigType)[];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  const validatedConfig = { ...firebaseConfig };
  
  if (missingFields.length > 0) {
    logger.warn(
      `Firebase yapılandırmasında eksik alanlar: ${missingFields.join(', ')}`,
      'FirebaseConfig',
      __filename,
      34
    );
    
    // Geliştirme ortamında eksik alanlar için yedek değerler kullan
    if (process.env.NODE_ENV === 'development') {
      // Eksik alanları doldur
      missingFields.forEach(field => {
        validatedConfig[field] = FALLBACK_CONFIG[field];
      });
      
      logger.info(
        'Eksik Firebase alanları geliştirme değerleriyle dolduruldu',
        'FirebaseConfig',
        __filename,
        52
      );
    } else {
      // Üretim ortamında eksik alanlar için uyarı logla
      logger.error(
        `Üretim ortamında eksik Firebase yapılandırma alanları: ${missingFields.join(', ')}`,
        'FirebaseConfig',
        __filename,
        59
      );
    }
  }
  
  // apiKey bir kez daha kontrol et - en kritik alan
  if (!validatedConfig.apiKey) {
    logger.error(
      'Firebase API Key tanımlanmamış! Firebase işlevselliği çalışmayabilir.',
      'FirebaseConfig',
      __filename,
      68
    );
    
    // Geliştirme ortamında yedek API key kullan
    if (process.env.NODE_ENV === 'development') {
      validatedConfig.apiKey = FALLBACK_CONFIG.apiKey;
    }
  }
  
  return validatedConfig;
};

// Firebase servislerini başlat
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  trackFlow('Firebase başlatılıyor', 'FirebaseConfig', FlowCategory.Firebase);
  
  // Firebase yapılandırmasını doğrula
  const validatedConfig = validateFirebaseConfig();
  
  // Uygulama başlatılmadan önce kontrol edelim
  if (!getApps().length) {
    try {
      app = initializeApp(validatedConfig);
      logger.info(
        'Firebase başarıyla başlatıldı',
        'FirebaseConfig',
        __filename,
        96
      );
      trackFlow('Firebase başarıyla başlatıldı', 'FirebaseConfig', FlowCategory.Firebase);
    } catch (initError) {
      logger.error(
        `Firebase başlatılamadı: ${initError instanceof Error ? initError.message : 'Bilinmeyen hata'}`,
        'FirebaseConfig',
        __filename,
        103,
        { error: initError }
      );
      
      // Minimum yapılandırmayla tekrar dene
      app = initializeApp({
        apiKey: validatedConfig.apiKey || FALLBACK_CONFIG.apiKey,
        authDomain: validatedConfig.authDomain || FALLBACK_CONFIG.authDomain,
        projectId: validatedConfig.projectId || FALLBACK_CONFIG.projectId,
      });
      logger.warn(
        'Firebase minimum yapılandırma ile başlatıldı',
        'FirebaseConfig',
        __filename,
        116
      );
    }
  } else {
    app = getApps()[0];
    logger.info(
      'Mevcut Firebase uygulaması kullanılıyor',
      'FirebaseConfig',
      __filename,
      124
    );
  }
  
  // Firestore ve Storage başlat
  try {
    db = getFirestore(app);
    storage = getStorage(app);
    logger.info(
      'Firestore ve Storage başarıyla başlatıldı',
      'FirebaseConfig',
      __filename,
      135
    );
  } catch (dbError) {
    logger.error(
      'Firebase servislerini başlatma hatası',
      'FirebaseConfig',
      __filename,
      140,
      { error: dbError }
    );
    // Minimum yeniden başlatma girişimi
    db = getFirestore(app);
    storage = getStorage(app);
  }
  
  // Auth servisi oluştur - tarayıcı ve sunucu taraflı çalışma için uyumlu
  if (typeof window !== 'undefined') {
    // İstemci tarafı - daha güçlü kalıcılık stratejisi kullan
    try {
      auth = initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence, // Öncelikle indexedDB kullan
          browserLocalPersistence,   // Fallback olarak localStorage
          browserSessionPersistence  // Son çare olarak sessionStorage
        ]
      });
      
      logger.info(
        'Firebase Auth tarayıcı tarafında başlatıldı',
        'FirebaseConfig',
        __filename,
        162
      );
    } catch (authInitError) {
      logger.error(
        'Firebase Auth özel başlatma hatası, standart yönteme dönülüyor',
        'FirebaseConfig',
        __filename,
        168,
        { error: authInitError }
      );
      
      // Hata durumunda getAuth kullanarak düz bir başlatma yap
      auth = getAuth(app);
    }
  } else {
    // Sunucu taraflı rendering için - hafıza içi kalıcılık kullan
    try {
      auth = initializeAuth(app, { persistence: inMemoryPersistence });
      logger.info(
        'Firebase Auth sunucu tarafında başlatıldı',
        'FirebaseConfig',
        __filename,
        180
      );
    } catch (serverAuthError) {
      logger.error(
        'Firebase Auth sunucu taraflı başlatma hatası',
        'FirebaseConfig',
        __filename,
        186,
        { error: serverAuthError }
      );
      // Geri dönüş - getAuth kullan
      auth = getAuth(app);
    }
  }
  
  // Geliştirme ortamında emülatör kullanımını ayarla
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      logger.info(
        'Firebase emülatörleri yapılandırılıyor',
        'FirebaseConfig',
        __filename,
        199
      );
      
      // Auth, Firestore ve Storage servislerinin varlığını kontrol et
      if (auth) connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      if (db) connectFirestoreEmulator(db, 'localhost', 8080);
      if (storage) connectStorageEmulator(storage, 'localhost', 9199);
      
      logger.info(
        'Firebase emülatörleri başarıyla yapılandırıldı',
        'FirebaseConfig',
        __filename,
        208
      );
      
      trackFlow('Firebase emülatörleri bağlandı', 'FirebaseConfig', FlowCategory.Firebase);
    } catch (emulatorError) {
      logger.error(
        'Firebase emülatörleri yapılandırılamadı',
        'FirebaseConfig',
        __filename,
        216,
        { error: emulatorError instanceof Error ? emulatorError.message : 'Bilinmeyen hata' }
      );
    }
  }
  
  // Auth durum değişikliklerini dinle ve hataları yakala
  if (typeof window !== 'undefined' && auth) { // Sadece tarayıcı ortamında ve auth tanımlı ise
    auth.onAuthStateChanged(
      (user) => {
        if (user) {
          logger.info(
            'Firebase Auth: Kullanıcı oturum açtı',
            'FirebaseConfig',
            __filename,
            230,
            { uid: user.uid }
          );
          
          trackFlow('Kullanıcı oturum açtı', 'FirebaseConfig', FlowCategory.Auth, { uid: user.uid });
        } else {
          logger.info(
            'Firebase Auth: Kullanıcı oturumu kapalı',
            'FirebaseConfig',
            __filename,
            238
          );
          
          trackFlow('Kullanıcı oturumu kapalı', 'FirebaseConfig', FlowCategory.Auth);
        }
      },
      (error) => {
        logger.error(
          'Firebase Auth hata',
          'FirebaseConfig',
          __filename,
          247,
          { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        );
        
        trackFlow('Oturum izleme hatası', 'FirebaseConfig', FlowCategory.Auth);
      },
    );
  }
} catch (error) {
  logger.error(
    'Firebase başlatma hatası',
    'FirebaseConfig',
    __filename,
    258,
    { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  );
  
  trackFlow('Firebase başlatma hatası', 'FirebaseConfig', FlowCategory.Firebase);
  
  // Uygulamanın çökmemesi için varsayılan nesneler oluştur
  if (!getApps().length) {
    try {
      // Minimum yapılandırma ile yeniden deneme
      app = initializeApp({
        apiKey: FALLBACK_CONFIG.apiKey,
        authDomain: FALLBACK_CONFIG.authDomain,
        projectId: FALLBACK_CONFIG.projectId,
      });
      
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      
      logger.warn(
        'Firebase minimum yapılandırma ile başlatıldı',
        'FirebaseConfig',
        __filename,
        280
      );
    } catch (fallbackError) {
      logger.error(
        'Firebase minimum yapılandırma ile bile başlatılamadı',
        'FirebaseConfig',
        __filename,
        285,
        { error: fallbackError instanceof Error ? fallbackError.message : 'Bilinmeyen hata' }
      );
      
      // Tarayıcı ortamında kullanıcıya uyarı göster
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          console.error('Firebase başlatılamadı! Uygulama düzgün çalışmayabilir.');
          // alert('Firebase bağlantısı kurulamadı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.');
        }, 1000);
      }
      
      // Değişkenlerin tanımlı olmasını sağla
      app = initializeApp({
        apiKey: FALLBACK_CONFIG.apiKey,
        authDomain: FALLBACK_CONFIG.authDomain,
        projectId: FALLBACK_CONFIG.projectId,
      });
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    }
  } else if (getApps().length > 0) {
    // Firebase app zaten var, ancak diğer servisler başlatılmamış olabilir
    app = getApps()[0];
    
    // Değişkenlerin kesinlikle tanımlı olmasını sağla
    db = getFirestore(app);
    auth = getAuth(app);  
    storage = getStorage(app);
  }
}

// Firebase servislerini dışa aktar
export { app, db, auth, storage };
