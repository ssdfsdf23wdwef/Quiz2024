// Bitirme_Kopya/frontend/src/app/firebase/config.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Firebase yapılandırma nesnesi
// Bu değerleri .env.local dosyasından alır, yoksa varsayılan değerleri kullanır
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyC_3HCvaCSsLDvO0IJNmjXNvtNffalUl8Y",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "my-app-71530.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "my-app-71530",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "my-app-71530.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "29159149861",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:29159149861:web:5ca6583d1f45efcb6e0acc",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-CZNHMSMK8P",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://my-app-71530-default-rtdb.firebaseio.com",
};

// Firebase uygulamasını başlat
let app: FirebaseApp;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("🔥 Firebase başarıyla başlatıldı");
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error("🔥 Firebase başlatma hatası:", error);
  throw error;
}

// Firestore veritabanını, kimlik doğrulamayı ve depolamayı başlat ve dışa aktar
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Auth durum değişikliklerini dinle ve hataları yakala
auth.onAuthStateChanged(
  (user) => {
    if (user) {
      console.log("🔒 Firebase Auth: Kullanıcı oturum açtı", user.uid);
    } else {
      console.log("🔓 Firebase Auth: Kullanıcı oturumu kapatıldı");
    }
  },
  (error) => {
    console.error("🔥 Firebase Auth hata:", error);
  },
);

// Firebase uygulamasını da dışa aktar
export { app };
