"use client";

import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthStore } from "@/store/auth.store";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { firebaseApp } from "@/app/firebase/config";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

/**
 * Firebase Auth'un ana state değişikliklerini izleyen ve Zustand store'a aktaran bileşen
 * AuthContext gibi işlevselliği bulunmaz; sadece Firebase auth state değişikliklerini izler
 * App kök bileşenine eklenmelidir
 */
export default function FirebaseAuthInitializer() {
  const { setFirebaseUser, setLoading } = useAuthStore();
  
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
    const auth = getAuth(firebaseApp);
    
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
          flowTracker.trackStep(
            'Auth', 
            'Firebase kullanıcısı algılandı', 
            'FirebaseAuthInitializer',
            { 
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              provider: firebaseUser.providerData[0]?.providerId || 'unknown'
            }
          );
        } else {
          flowTracker.trackStep(
            'Auth', 
            'Firebase kullanıcısı bulunamadı', 
            'FirebaseAuthInitializer'
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
        
        flowTracker.trackStep(
          'Auth', 
          'Firebase Auth hatası', 
          'FirebaseAuthInitializer',
          { errorCode: error.code, errorMessage: error.message }
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
