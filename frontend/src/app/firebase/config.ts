// Bitirme_Kopya/frontend/src/app/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAuth, Auth, connectAuthEmulator, browserPopupRedirectResolver } from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, FirebaseStorage, connectStorageEmulator } from "firebase/storage";
import { getLogger, trackFlow, FlowCategory } from "@/lib/logger.utils";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();

// Firebase yapılandırma nesnesini çevresel değişkenlerden al
// Doğrudan hard-coded değerler kullanmaktan kaçın
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

// Firebase yapılandırmasının geçerliliğini kontrol et
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'] as (keyof FirebaseConfigType)[];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    logger.warn(
      `Firebase yapılandırmasında eksik alanlar: ${missingFields.join(', ')}`,
      'FirebaseConfig',
      __filename,
      34
    );
    
    // Geliştirme ortamında eksik alanlar için yedek değerler kullan
    if (process.env.NODE_ENV === 'development') {
      const fallbackConfig: FirebaseConfigType = {
        apiKey: "AIzaSyC_3HCvaCSsLDvO0IJNmjXNvtNffalUl8Y",
        authDomain: "my-app-71530.firebaseapp.com",
        projectId: "my-app-71530",
        storageBucket: "my-app-71530.appspot.com",
        messagingSenderId: "29159149861",
        appId: "1:29159149861:web:5ca6583d1f45efcb6e0acc",
        measurementId: "G-CZNHMSMK8P",
        databaseURL: "https://my-app-71530-default-rtdb.firebaseio.com",
      };
      
      // Eksik alanları doldur
      missingFields.forEach(field => {
        firebaseConfig[field] = fallbackConfig[field];
      });
      
      logger.info(
        'Eksik Firebase alanları geliştirme değerleriyle dolduruldu',
        'FirebaseConfig',
        __filename,
        52
      );
    }
  }
  
  return firebaseConfig;
};

// Firebase uygulamasını başlat
let app: FirebaseApp | undefined;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  // trackFlow fonksiyonunu kullanarak FlowCategory'yi doğru şekilde kullan
  trackFlow('Firebase başlatılıyor', 'FirebaseConfig', FlowCategory.Firebase);
  
  // Firebase yapılandırmasını doğrula
  const validatedConfig = validateFirebaseConfig();
  
  // Uygulama başlatılmadan önce kontrol edelim
  if (!getApps().length) {
    app = initializeApp(validatedConfig);
    
    logger.info(
      'Firebase başarıyla başlatıldı',
      'FirebaseConfig',
      __filename,
      76
    );
    
    trackFlow('Firebase başarıyla başlatıldı', 'FirebaseConfig', FlowCategory.Firebase);
  } else {
    app = getApps()[0];
    
    logger.info(
      'Mevcut Firebase uygulaması kullanılıyor',
      'FirebaseConfig',
      __filename,
      85
    );
  }
  
  // Firestore veritabanını, kimlik doğrulamayı ve depolamayı başlat
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  // Geliştirme ortamında emülatör kullanımını ayarla
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      logger.info(
        'Firebase emülatörleri yapılandırılıyor',
        'FirebaseConfig',
        __filename,
        100
      );
      
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      
      logger.info(
        'Firebase emülatörleri başarıyla yapılandırıldı',
        'FirebaseConfig',
        __filename,
        108
      );
      
      trackFlow('Firebase emülatörleri bağlandı', 'FirebaseConfig', FlowCategory.Firebase);
    } catch (emulatorError) {
      logger.error(
        'Firebase emülatörleri yapılandırılamadı',
        'FirebaseConfig',
        __filename,
        116,
        { error: emulatorError instanceof Error ? emulatorError.message : 'Bilinmeyen hata' }
      );
    }
  }
  
  // Auth durum değişikliklerini dinle ve hataları yakala
  auth.onAuthStateChanged(
    (user) => {
      if (user) {
        logger.info(
          'Firebase Auth: Kullanıcı oturum açtı',
          'FirebaseConfig',
          __filename,
          128,
          { uid: user.uid }
        );
        
        trackFlow('Kullanıcı oturum açtı', 'FirebaseConfig', FlowCategory.Auth, { uid: user.uid });
      } else {
        logger.info(
          'Firebase Auth: Kullanıcı oturumu kapalı',
          'FirebaseConfig',
          __filename,
          136
        );
        
        trackFlow('Kullanıcı oturumu kapalı', 'FirebaseConfig', FlowCategory.Auth);
      }
    },
    (error) => {
      logger.error(
        'Firebase Auth hata',
        'FirebaseConfig',
        __filename,
        145,
        { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      );
      
      trackFlow('Oturum izleme hatası', 'FirebaseConfig', FlowCategory.Auth);
    },
  );
} catch (error) {
  logger.error(
    'Firebase başlatma hatası',
    'FirebaseConfig',
    __filename,
    155,
    { error: error instanceof Error ? error.message : 'Bilinmeyen hata' }
  );
  
  trackFlow('Firebase başlatma hatası', 'FirebaseConfig', FlowCategory.Firebase);
  
  // Uygulamanın çökmemesi için varsayılan nesneler oluştur
  if (!app && getApps().length === 0) {
    try {
      // Minimum yapılandırma ile yeniden deneme
      const minimalConfig = {
        apiKey: "AIzaSyC_3HCvaCSsLDvO0IJNmjXNvtNffalUl8Y",
        authDomain: "my-app-71530.firebaseapp.com",
        projectId: "my-app-71530",
      };
      
      app = initializeApp(minimalConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      
      logger.warn(
        'Firebase minimum yapılandırma ile başlatıldı',
        'FirebaseConfig',
        __filename,
        175
      );
    } catch (fallbackError) {
      logger.error(
        'Firebase minimum yapılandırma ile bile başlatılamadı',
        'FirebaseConfig',
        __filename,
        180,
        { error: fallbackError instanceof Error ? fallbackError.message : 'Bilinmeyen hata' }
      );
      
      // Burada artık cidden bir sorun var, tüm kullanıcıya bir uyarı gösterilmeli
      if (typeof window !== 'undefined') {
        // Tarayıcı çevresi kontrolü
        setTimeout(() => {
          alert('Firebase başlatılamadı. Lütfen sayfayı yenileyin veya yöneticinize başvurun.');
        }, 1000);
      }
    }
  }
}

// Firebase app'ı kesinlikle tanımlı değilse tekrar başlatmaya çalış
if (!app) {
  app = getApps().length ? getApps()[0] : initializeApp({
    apiKey: "AIzaSyC_3HCvaCSsLDvO0IJNmjXNvtNffalUl8Y",
    authDomain: "my-app-71530.firebaseapp.com",
    projectId: "my-app-71530",
  });
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
}

// Firebase servislerini dışa aktar
export { app, db, auth, storage };
