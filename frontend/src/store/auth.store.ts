'use client';

import { type StateCreator, create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/user";
import { User as FirebaseUser } from "firebase/auth";
import { getLogger, getFlowTracker } from "../lib/logger.utils";
import { FlowCategory } from "../services/flow-tracker.service";

// AuthState tipini dışa aktarıyoruz, böylece diğer dosyalardan kullanılabilir
export interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastAuthenticatedAt: number | null; // Son kimlik doğrulama zamanı
  
  // Actions
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  updateLocalUser: (updates: Partial<User>) => void;
  logoutUser: () => void;
}

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// Tarayıcı ortamı kontrolü
const isBrowser = typeof window !== 'undefined';

// AuthStore implementasyonu
const createAuthSlice: StateCreator<AuthState> = (set, get) => ({
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  lastAuthenticatedAt: null,
  
  setUser: (user) => {
    if (isBrowser) {
      logger.debug(
        `Kullanıcı ayarlanıyor: ${user ? user.email : 'null'}`,
        'AuthStore.setUser',
        'auth.store.ts',
        29
      );
      
      flowTracker.trackStateChange('user', 'AuthStore', get().user, user);
    }
    
    set({ 
      user, 
      isAuthenticated: !!user,
      lastAuthenticatedAt: user ? Date.now() : null
    });
    
    if (isBrowser && user) {
      flowTracker.trackStep(FlowCategory.Auth, 'Kullanıcı oturumu kuruldu', 'AuthStore', {
        userId: user.id,
        email: user.email
      });
    }
  },
  
  setFirebaseUser: (firebaseUser) => {
    if (isBrowser) {
      logger.debug(
        `Firebase kullanıcısı ayarlanıyor: ${firebaseUser ? firebaseUser.email : 'null'}`,
        'AuthStore.setFirebaseUser',
        'auth.store.ts',
        49
      );
    }
    
    set({ firebaseUser });
  },
  
  setLoading: (isLoading) => {
    if (isBrowser) {
      logger.debug(
        `Yükleme durumu ayarlanıyor: ${isLoading}`,
        'AuthStore.setLoading',
        'auth.store.ts',
        59
      );
    }
    
    set({ isLoading });
  },
  
  updateLocalUser: (updates) => {
    if (isBrowser) {
      logger.debug(
        'Yerel kullanıcı güncelleniyor',
        'AuthStore.updateLocalUser',
        'auth.store.ts',
        69,
        { updatedFields: Object.keys(updates) }
      );
    }
    
    const currentUser = get().user;
    const updatedUser = currentUser ? { ...currentUser, ...updates } : null;
    
    if (isBrowser) {
      flowTracker.trackStateChange('user', 'AuthStore', currentUser, updatedUser);
    }
    
    set({
      user: updatedUser
    });
  },
  
  logoutUser: () => {
    if (isBrowser) {
      logger.info(
        'Kullanıcı oturumu kapatılıyor',
        'AuthStore.logoutUser',
        'auth.store.ts',
        87
      );
      
      flowTracker.trackStep(FlowCategory.Auth, 'Kullanıcı oturumu kapatıldı', 'AuthStore');
    }
    
    set({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      lastAuthenticatedAt: null
    });
  },
});

// Doğrudan hook'u oluştur ve ihraç et
export const useAuthStore = create<AuthState>()(
  persist(
    createAuthSlice,
    {
      name: "auth-storage",
      storage: createJSONStorage(() => (isBrowser ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          firstName: state.user.firstName,
          lastName: state.user.lastName,
          profileImageUrl: state.user.profileImageUrl,
          role: state.user.role,
          onboarded: state.user.onboarded,
        } : null,
        isAuthenticated: state.isAuthenticated,
        lastAuthenticatedAt: state.lastAuthenticatedAt
      }),
    }
  )
);

// İsteğe bağlı: Tip güvenli selektörleri koru
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthStatus = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
}));
export const useLogoutUserAction = () => useAuthStore((state) => state.logoutUser);
