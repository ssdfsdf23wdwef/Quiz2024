"use client";

import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthStore, AuthState } from "@/store/auth.store";
import { getLogger, getFlowTracker, FlowCategory, trackFlow } from "@/lib/logger.utils";
import { app } from "@/app/firebase/config";
import { FirebaseError } from "firebase/app";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * Firebase Auth'un ana state değişikliklerini izleyen ve Zustand store'a aktaran bileşen
 * AuthContext gibi işlevselliği bulunmaz; sadece Firebase auth state değişikliklerini izler
 * App kök bileşenine eklenmelidir
 */
export default function FirebaseAuthInitializer() {
  const authStore = useAuthStore();
  const { setFirebaseUser, setLoading } = authStore as unknown as AuthState;
  
  useEffect(() => {
    const seqId = flowTracker.startSequence('FirebaseAuthInitialization');
    
    logger.info(
      'Firebase Auth Initializer başlatıldı',
      'FirebaseAuthInitializer',
      'FirebaseAuthInitializer.tsx',
      24
    );
    
    setLoading(true);
    
    // Firebase Auth nesnesini al
    const auth = getAuth(app);
    
    // Auth değişikliklerini izleyen unsubscribe fonksiyonu
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        logger.debug(
          `Firebase Auth durumu değişti: ${firebaseUser ? 'Oturum açık' : 'Oturum kapalı'}`,
          'FirebaseAuthInitializer.onAuthStateChanged',
          'FirebaseAuthInitializer.tsx',
          37,
          firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : undefined
        );
        
        // Global Zustand store'u güncelle
        setFirebaseUser(firebaseUser);
        setLoading(false);
        
        // Akış izleme
        if (firebaseUser) {
          trackFlow(
            'Firebase kullanıcısı algılandı', 
            'FirebaseAuthInitializer',
            FlowCategory.Auth,
            { 
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              provider: firebaseUser.providerData[0]?.providerId || 'unknown'
            }
          );
        } else {
          trackFlow(
            'Firebase kullanıcısı bulunamadı', 
            'FirebaseAuthInitializer',
            FlowCategory.Auth
          );
        }
      },
      (error) => {
        // Hata durumunda
        logger.error(
          'Firebase Auth izleme hatası',
          'FirebaseAuthInitializer.onAuthStateChanged',
          'FirebaseAuthInitializer.tsx',
          65,
          { error }
        );
        
        setLoading(false);
        setFirebaseUser(null);
        
        // FirebaseError kontrolü ekleyerek 'code' özelliğine güvenli erişim
        let errorCode = 'unknown';
        if (error instanceof FirebaseError) {
          errorCode = error.code;
        }
        
        trackFlow(
          'Firebase Auth hatası', 
          'FirebaseAuthInitializer',
          FlowCategory.Auth,
          { errorCode: errorCode, errorMessage: error.message }
        );
      }
    );
    
    // Temizleme fonksiyonu
    return () => {
      logger.debug(
        'Firebase Auth izleyici temizleniyor',
        'FirebaseAuthInitializer',
        'FirebaseAuthInitializer.tsx',
        82
      );
      
      unsubscribe();
      flowTracker.endSequence(seqId);
    };
  }, [setFirebaseUser, setLoading]);
  
  // Bu bileşen hiçbir şey render etmez
  return null;
}
