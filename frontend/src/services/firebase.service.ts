import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  Timestamp,
  Query, // Query tipini içe aktarın
  FirestoreError
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  Auth,
  IdTokenResult,
  AuthError
} from "firebase/auth";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  StorageError
} from "firebase/storage";
import { db, auth, storage } from "../app/firebase/config";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { FlowCategory } from "@/services/flow-tracker.service";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// Firestore koşul tipi
export interface FirestoreCondition {
  field: string;
  operator: "==" | ">" | "<" | ">=" | "<=";
  value: string | number | boolean | Date | null;
}

// Firebase'i başlat
const googleProvider = new GoogleAuthProvider();

const firebaseCategories = {
  firestoreCategory: 'Custom' as FlowCategory,
  storageCategory: 'Custom' as FlowCategory,
  authCategory: 'Auth' as FlowCategory
};

// Firebase Authentication Servisi
export const firebaseService = {
  // Mevcut auth nesnesini döndür
  getAuth: (): Auth => auth,

  // Firestore için özel kategoriler
  firestoreCategory: 'Custom' as FlowCategory,
  storageCategory: 'Custom' as FlowCategory,

  // E-posta ve şifre ile kayıt ol
  signUp: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> => {
    flowTracker.markStart('signUp');
    
    try {
      flowTracker.trackStep(
        'Auth', 
        'Kayıt işlemi başlatıldı', 
        'firebaseService.signUp',
        { email }
      );
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      logger.debug(
        `Kullanıcı kaydı oluşturuldu: ${email}`,
        'firebaseService.signUp',
        __filename,
        58,
        { uid: userCredential.user.uid }
      );

      // Kullanıcı adını güncelle
      if (firstName || lastName) {
        const displayName = [firstName, lastName].filter(Boolean).join(" ");
        
        flowTracker.trackStep(
          'Auth', 
          'Profil bilgileri güncelleniyor', 
          'firebaseService.signUp',
          { displayName }
        );
        
        await updateProfile(userCredential.user, {
          displayName,
        });
        
        logger.debug(
          `Kullanıcı profili güncellendi: ${displayName}`,
          'firebaseService.signUp',
          __filename,
          75,
          { uid: userCredential.user.uid }
        );
      }

      // Başarılı sonuç
      const duration = flowTracker.markEnd('signUp', 'Auth', 'firebaseService');
      logger.info(
        `Kullanıcı başarıyla kaydedildi: ${email}`,
        'firebaseService.signUp',
        __filename,
        85,
        { duration }
      );
      
      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
      flowTracker.markEnd('signUp', 'Auth', 'firebaseService');
      logger.error(
        `Kullanıcı kaydı başarısız: ${email}`,
        'firebaseService.signUp',
        __filename,
        96,
        { 
          email, 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // E-posta ve şifre ile giriş yap
  signIn: async (email: string, password: string): Promise<User> => {
    flowTracker.markStart('signIn');
    
    try {
      flowTracker.trackStep(
        'Auth', 
        'Giriş işlemi başlatıldı', 
        'firebaseService.signIn',
        { email }
      );
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('signIn', 'Auth', 'firebaseService');
      logger.info(
        `Kullanıcı girişi başarılı: ${email}`,
        'firebaseService.signIn',
        __filename,
        123,
        { 
          uid: userCredential.user.uid,
          duration 
        }
      );
      
      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
      flowTracker.markEnd('signIn', 'Auth', 'firebaseService');
      logger.error(
        `Kullanıcı girişi başarısız: ${email}`,
        'firebaseService.signIn',
        __filename,
        137,
        { 
          email, 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Google ile giriş yap
  signInWithGooglePopup: async (): Promise<User> => {
    flowTracker.markStart('signInWithGoogle');
    
    try {
      flowTracker.trackStep(
        'Auth', 
        'Google ile giriş başlatıldı', 
        'firebaseService.signInWithGooglePopup'
      );
      
      const userCredential = await signInWithPopup(auth, googleProvider);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('signInWithGoogle', 'Auth', 'firebaseService');
      logger.info(
        `Google ile giriş başarılı: ${userCredential.user.email}`,
        'firebaseService.signInWithGooglePopup',
        __filename,
        163,
        { 
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          duration 
        }
      );
      
      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
      flowTracker.markEnd('signInWithGoogle', 'Auth', 'firebaseService');
      logger.error(
        'Google ile giriş başarısız',
        'firebaseService.signInWithGooglePopup',
        __filename,
        178,
        { 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Çıkış yap
  signOut: async (): Promise<void> => {
    flowTracker.markStart('signOut');
    
    try {
      // Mevcut kullanıcı bilgilerini al
      const currentUser = auth.currentUser;
      const userEmail = currentUser?.email;
      const userId = currentUser?.uid;
      
      flowTracker.trackStep('Auth', 'Çıkış işlemi başlatıldı', 'firebaseService.signOut');
      
      await signOut(auth);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('signOut', 'Auth', 'firebaseService');
      logger.info(
        `Kullanıcı çıkışı başarılı${userEmail ? ': ' + userEmail : ''}`,
        'firebaseService.signOut',
        __filename,
        202,
        { userId, duration }
      );
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
      flowTracker.markEnd('signOut', 'Auth', 'firebaseService');
      logger.error(
        'Kullanıcı çıkışı başarısız',
        'firebaseService.signOut',
        __filename,
        211,
        { 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Şifre sıfırlama e-postası gönder
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    flowTracker.markStart('sendPasswordReset');
    
    try {
      flowTracker.trackStep(
        'Auth', 
        'Şifre sıfırlama e-postası gönderiliyor', 
        'firebaseService.sendPasswordResetEmail',
        { email }
      );
      
      await sendPasswordResetEmail(auth, email);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd('sendPasswordReset', 'Auth', 'firebaseService');
      logger.info(
        `Şifre sıfırlama e-postası gönderildi: ${email}`,
        'firebaseService.sendPasswordResetEmail',
        __filename,
        236,
        { email, duration }
      );
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
      flowTracker.markEnd('sendPasswordReset', 'Auth', 'firebaseService');
      logger.error(
        `Şifre sıfırlama e-postası gönderilemedi: ${email}`,
        'firebaseService.sendPasswordResetEmail',
        __filename,
        245,
        { 
          email,
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Auth durumu değişikliklerini izle
  onAuthChanged: (callback: (user: User | null) => void): (() => void) => {
    logger.debug(
      'Auth durumu değişikliği dinleyicisi ekleniyor',
      'firebaseService.onAuthChanged',
      __filename,
      260
    );
    
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        logger.debug(
          `Auth durumu değişti: Oturum açık (${user.email})`,
          'firebaseService.onAuthChanged',
          __filename,
          268,
          { uid: user.uid, email: user.email }
        );
      } else {
        logger.debug(
          'Auth durumu değişti: Oturum kapalı',
          'firebaseService.onAuthChanged',
          __filename,
          275
        );
      }
      
      callback(user);
    });
  },

  // Kullanıcının ID token'ını al
  getCurrentUserToken: async (forceRefresh = false): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        logger.debug(
          'Token istendi ama kullanıcı oturumu açık değil',
          'firebaseService.getCurrentUserToken',
          __filename,
          290
        );
        return null;
      }
      
      flowTracker.trackStep(
        'Auth', 
        'Kullanıcı token\'ı alınıyor', 
        'firebaseService.getCurrentUserToken',
        { forceRefresh }
      );
      
      const token = await user.getIdToken(forceRefresh);
      
      logger.debug(
        'Kullanıcı token\'ı başarıyla alındı',
        'firebaseService.getCurrentUserToken',
        __filename,
        305,
        { uid: user.uid }
      );
      
      return token;
    } catch (error: unknown) {
      const authError = error as AuthError;
      logger.error(
        'Token alınırken hata oluştu',
        'firebaseService.getCurrentUserToken',
        __filename,
        315,
        { 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Kullanıcının ID token'ı ile ilgili bilgileri al
  getIdTokenResult: async (
    forceRefresh = false,
  ): Promise<IdTokenResult | null> => {
    try {
      const user = auth.currentUser;
      if (!user) {
        logger.debug(
          'Token sonucu istendi ama kullanıcı oturumu açık değil',
          'firebaseService.getIdTokenResult',
          __filename,
          334
        );
        return null;
      }
      
      flowTracker.trackStep(
        'Auth', 
        'Token sonuçları alınıyor', 
        'firebaseService.getIdTokenResult',
        { forceRefresh }
      );
      
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      
      logger.debug(
        'Token sonuçları başarıyla alındı',
        'firebaseService.getIdTokenResult',
        __filename,
        349,
        { 
          uid: user.uid,
          expirationTime: tokenResult.expirationTime 
        }
      );
      
      return tokenResult;
    } catch (error: unknown) {
      const authError = error as AuthError;
      logger.error(
        'Token sonuçları alınırken hata oluştu',
        'firebaseService.getIdTokenResult',
        __filename,
        361,
        { 
          errorCode: authError.code,
          errorMessage: authError.message 
        }
      );
      throw authError;
    }
  },

  // Mevcut kullanıcıyı döndür
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },
};

// Firestore veri servisi
export const firestoreService = {
  // Belge oluşturma
  createDocument: async <T>(
    collectionName: string,
    data: T,
  ): Promise<string> => {
    flowTracker.markStart(`createDocument_${collectionName}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.firestoreCategory, 
        `Doküman oluşturuluyor: ${collectionName}`, 
        'firestoreService.createDocument'
      );
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`createDocument_${collectionName}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.debug(
        `Doküman oluşturuldu: ${collectionName}/${docRef.id}`,
        'firestoreService.createDocument',
        __filename,
        398,
        { collectionName, docId: docRef.id, duration }
      );
      
      return docRef.id;
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
      flowTracker.markEnd(`createDocument_${collectionName}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.error(
        `${collectionName} oluşturma başarısız`,
        'firestoreService.createDocument',
        __filename,
        409,
        { 
          collectionName,
          errorCode: fbError.code,
          errorMessage: fbError.message 
        }
      );
      throw fbError;
    }
  },

  // Belge güncelleme
  updateDocument: async <T>(
    collectionName: string,
    docId: string,
    data: Partial<T>,
  ): Promise<void> => {
    flowTracker.markStart(`updateDocument_${collectionName}_${docId}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.firestoreCategory, 
        `Doküman güncelleniyor: ${collectionName}/${docId}`, 
        'firestoreService.updateDocument'
      );
      
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`updateDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.debug(
        `Doküman güncellendi: ${collectionName}/${docId}`,
        'firestoreService.updateDocument',
        __filename,
        440,
        { 
          collectionName, 
          docId, 
          fields: Object.keys(data as object).length,
          duration 
        }
      );
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
      flowTracker.markEnd(`updateDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.error(
        `${collectionName} güncelleme başarısız: ${docId}`,
        'firestoreService.updateDocument',
        __filename,
        453,
        { 
          collectionName,
          docId,
          errorCode: fbError.code,
          errorMessage: fbError.message 
        }
      );
      throw fbError;
    }
  },

  // Belge silme
  deleteDocument: async (
    collectionName: string,
    docId: string,
  ): Promise<void> => {
    flowTracker.markStart(`deleteDocument_${collectionName}_${docId}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.firestoreCategory, 
        `Doküman siliniyor: ${collectionName}/${docId}`, 
        'firestoreService.deleteDocument'
      );
      
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.debug(
        `Doküman silindi: ${collectionName}/${docId}`,
        'firestoreService.deleteDocument',
        __filename,
        481,
        { collectionName, docId, duration }
      );
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
      flowTracker.markEnd(`deleteDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.error(
        `${collectionName} silme başarısız: ${docId}`,
        'firestoreService.deleteDocument',
        __filename,
        490,
        { 
          collectionName,
          docId,
          errorCode: fbError.code,
          errorMessage: fbError.message 
        }
      );
      throw fbError;
    }
  },

  // Belge getirme
  getDocument: async <T>(
    collectionName: string,
    docId: string,
  ): Promise<T | null> => {
    flowTracker.markStart(`getDocument_${collectionName}_${docId}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.firestoreCategory, 
        `Doküman getiriliyor: ${collectionName}/${docId}`, 
        'firestoreService.getDocument'
      );
      
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      
      if (docSnap.exists()) {
        logger.debug(
          `Doküman bulundu: ${collectionName}/${docId}`,
          'firestoreService.getDocument',
          __filename,
          520,
          { collectionName, docId, duration }
        );
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        logger.debug(
          `Doküman bulunamadı: ${collectionName}/${docId}`,
          'firestoreService.getDocument',
          __filename,
          527,
          { collectionName, docId, duration }
        );
        return null;
      }
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
      flowTracker.markEnd(`getDocument_${collectionName}_${docId}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.error(
        `${collectionName} getirme başarısız: ${docId}`,
        'firestoreService.getDocument',
        __filename,
        538,
        { 
          collectionName,
          docId,
          errorCode: fbError.code,
          errorMessage: fbError.message 
        }
      );
      throw fbError;
    }
  },

  // Koleksiyon getirme
  getCollection: async <T>(
    collectionName: string,
    conditions?: FirestoreCondition[],
    sortField?: string,
    sortDirection?: "asc" | "desc",
    limitCount?: number,
  ): Promise<T[]> => {
    flowTracker.markStart(`getCollection_${collectionName}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.firestoreCategory, 
        `Koleksiyon getiriliyor: ${collectionName}`, 
        'firestoreService.getCollection',
        { 
          conditions: conditions?.length ?? 0,
          sortField,
          sortDirection,
          limitCount 
        }
      );
      
      // Düzeltme: 'q' değişkeninin tipi Query<DocumentData, DocumentData> olarak belirtildi.
      let q: Query<DocumentData, DocumentData> = collection(db, collectionName);

      // Koşullar varsa ekle
      if (conditions && conditions.length > 0) {
        q = query(
          q,
          ...conditions.map((c) => where(c.field, c.operator, c.value)),
        );
      }

      // Sıralama varsa ekle
      if (sortField) {
        q = query(q, orderBy(sortField, sortDirection || "asc"));
      }

      // Limit varsa ekle
      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as T,
      );
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getCollection_${collectionName}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.debug(
        `Koleksiyon getirildi: ${collectionName} (${results.length} doküman)`,
        'firestoreService.getCollection',
        __filename,
        684,
        { 
          collectionName, 
          documentCount: results.length,
          duration 
        }
      );
      
      return results;
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
      flowTracker.markEnd(`getCollection_${collectionName}`, firebaseCategories.firestoreCategory, 'firestoreService');
      logger.error(
        `${collectionName} koleksiyonu getirme başarısız`,
        'firestoreService.getCollection',
        __filename,
        699,
        { 
          collectionName,
          errorCode: fbError.code,
          errorMessage: fbError.message 
        }
      );
      throw fbError;
    }
  },
};

// Storage servisi
export const storageService = {
  // Dosya yükleme
  uploadFile: async (
    storagePath: string,
    file: File,
    progressCallback?: (progress: number) => void,
  ): Promise<string> => {
    flowTracker.markStart(`uploadFile_${storagePath}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.storageCategory, 
        `Dosya yükleniyor: ${storagePath}`, 
        'storageService.uploadFile',
        { fileName: file.name, fileSize: file.size }
      );
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progressCallback) {
              progressCallback(progress);
            }
            
            logger.debug(
              `Dosya yükleme ilerlemesi: ${progress.toFixed(2)}%`,
              'storageService.uploadFile',
              __filename,
              789,
              { 
                storagePath, 
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes 
              }
            );
          },
          (error) => {
            const storageError = error as StorageError;
            flowTracker.markEnd(`uploadFile_${storagePath}`, firebaseCategories.storageCategory, 'storageService');
            logger.error(
              `Dosya yükleme başarısız: ${storagePath}`,
              'storageService.uploadFile',
              __filename,
              802,
              { 
                storagePath,
                errorCode: storageError.code,
                errorMessage: storageError.message 
              }
            );
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const duration = flowTracker.markEnd(`uploadFile_${storagePath}`, firebaseCategories.storageCategory, 'storageService');
            logger.debug(
              `Dosya yükleme tamamlandı: ${storagePath}`,
              'storageService.uploadFile',
              __filename,
              817,
              { 
                storagePath, 
                fileSize: file.size,
                duration 
              }
            );
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
      flowTracker.markEnd(`uploadFile_${storagePath}`, firebaseCategories.storageCategory, 'storageService');
      logger.error(
        `Dosya yükleme başarısız: ${storagePath}`,
        'storageService.uploadFile',
        __filename,
        835,
        { 
          storagePath,
          errorCode: storageError.code,
          errorMessage: storageError.message 
        }
      );
      throw storageError;
    }
  },

  // Dosya silme
  deleteFile: async (path: string): Promise<void> => {
    flowTracker.markStart(`deleteFile_${path}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.storageCategory, 
        `Dosya siliniyor: ${path}`, 
        'storageService.deleteFile'
      );
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`deleteFile_${path}`, firebaseCategories.storageCategory, 'storageService');
      logger.info(
        `Dosya başarıyla silindi: ${path}`,
        'storageService.deleteFile',
        __filename,
        727,
        { path, duration }
      );
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
      flowTracker.markEnd(`deleteFile_${path}`, firebaseCategories.storageCategory, 'storageService');
      logger.error(
        `Dosya silme başarısız: ${path}`,
        'storageService.deleteFile',
        __filename,
        736,
        { 
          path,
          errorCode: storageError.code,
          errorMessage: storageError.message
        }
      );
      throw storageError;
    }
  },

  // Download URL'i al
  getFileUrl: async (path: string): Promise<string> => {
    flowTracker.markStart(`getFileUrl_${path}`);
    
    try {
      flowTracker.trackStep(
        firebaseCategories.storageCategory, 
        `Dosya URL'i alınıyor: ${path}`, 
        'storageService.getFileUrl'
      );
      
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      // Başarılı sonuç
      const duration = flowTracker.markEnd(`getFileUrl_${path}`, firebaseCategories.storageCategory, 'storageService');
      logger.debug(
        `Dosya URL'i alındı: ${path}`,
        'storageService.getFileUrl',
        __filename,
        763,
        { path, duration }
      );
      
      return url;
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
      flowTracker.markEnd(`getFileUrl_${path}`, firebaseCategories.storageCategory, 'storageService');
      logger.error(
        `Dosya URL'i alınamadı: ${path}`,
        'storageService.getFileUrl',
        __filename,
        774,
        { 
          path,
          errorCode: storageError.code,
          errorMessage: storageError.message
        }
      );
      throw storageError;
    }
  },
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  auth: firebaseService,
  firestore: firestoreService,
  storage: storageService,
};
