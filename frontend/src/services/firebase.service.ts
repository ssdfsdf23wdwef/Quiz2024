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



// Firestore koşul tipi
export interface FirestoreCondition {
  field: string;
  operator: "==" | ">" | "<" | ">=" | "<=";
  value: string | number | boolean | Date | null;
}

// Firebase'i başlat
const googleProvider = new GoogleAuthProvider();


// Firebase Authentication Servisi
export const firebaseService = {
  // Mevcut auth nesnesini döndür
  getAuth: (): Auth => auth,

  // Firestore için özel kategoriler


  // E-posta ve şifre ile kayıt ol
  signUp: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ): Promise<User> => {
    
    try {
    
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

     

      // Kullanıcı adını güncelle
      if (firstName || lastName) {
        const displayName = [firstName, lastName].filter(Boolean).join(" ");
        
       
        
        await updateProfile(userCredential.user, {
          displayName,
        });
     
      }

    
      
      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
    
      throw authError;
    }
  },

  // E-posta ve şifre ile giriş yap
  signIn: async (email: string, password: string): Promise<User> => {
    
    try {
    
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      
      // Başarılı sonuç
    
      
      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
     
      throw authError;
    }
  },

  // Google ile giriş yap
  signInWithGooglePopup: async (): Promise<User> => {
    
    try {
   
      
      const userCredential = await signInWithPopup(auth, googleProvider);

      return userCredential.user;
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
   
      throw authError;
    }
  },

  // Çıkış yap
  signOut: async (): Promise<void> => {
    
    try {
      // Mevcut kullanıcı bilgilerini al
      const currentUser = auth.currentUser;
      const userEmail = currentUser?.email;
      const userId = currentUser?.uid;
      
      
      await signOut(auth);
      
      // Başarılı sonuç
     
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
    
      throw authError;
    }
  },

  // Şifre sıfırlama e-postası gönder
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    
    try {
    
      
      await sendPasswordResetEmail(auth, email);
      
      // Başarılı sonuç
      
    } catch (error: unknown) {
      // Hata durumu
      const authError = error as AuthError;
     
      throw authError;
    }
  },

  // Auth durumu değişikliklerini izle
  onAuthChanged: (callback: (user: User | null) => void): (() => void) => {
   
    
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        
      } else {
     
      }
      
      callback(user);
    });
  },

  // Kullanıcının ID token'ını al
  getCurrentUserToken: async (forceRefresh = false): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      if (!user) {
      
        return null;
      }
      
     
      
      const token = await user.getIdToken(forceRefresh);
      
      
      return token;
    } catch (error: unknown) {
      const authError = error as AuthError;
     
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
      
        return null;
      }
      
     
      
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      
      
      return tokenResult;
    } catch (error: unknown) {
      const authError = error as AuthError;
     
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
    
    try {
    
      
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      

      
      return docRef.id;
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
 
      throw fbError;
    }
  },

  // Belge güncelleme
  updateDocument: async <T>(
    collectionName: string,
    docId: string,
    data: Partial<T>,
  ): Promise<void> => {
    
    try {
     
      
      // Başarılı sonuç
   
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
    
      throw fbError;
    }
  },

  // Belge silme
  deleteDocument: async (
    collectionName: string,
    docId: string,
  ): Promise<void> => {
    
    try {
     
      
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      // Başarılı sonuç
      
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
    
      throw fbError;
    }
  },

  // Belge getirme
  getDocument: async <T>(
    collectionName: string,
    docId: string,
  ): Promise<T | null> => {
    try {
    
      
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      // Başarılı sonuç
      
      
      if (docSnap.exists()) {
      
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
       
        return null;
      }
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
     
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
  
    
    try {
     
      
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
      
     
      
      return results;
    } catch (error: unknown) {
      // Hata durumu
      const fbError = error as FirestoreError;
   
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
    
    try {
    
      
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
            
          
          },
          (error) => {
            const storageError = error as StorageError;
           
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
           
            
            resolve(downloadURL);
          }
        );
      });
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
     
      throw storageError;
    }
  },

  // Dosya silme
  deleteFile: async (path: string): Promise<void> => {
    
    try {
 
      
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      
      // Başarılı sonuç
     
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
     
      throw storageError;
    }
  },

  // Download URL'i al
  getFileUrl: async (path: string): Promise<string> => {
    
    try {
     
      
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      // Başarılı sonuç
  
      
      return url;
    } catch (error: unknown) {
      // Hata durumu
      const storageError = error as StorageError;
  
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
