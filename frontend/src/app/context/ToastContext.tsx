"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo
} from "react";
import { getLogger, getFlowTracker } from "@/lib/logger.utils";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

// Toast tipleri
export type ToastType = "success" | "error" | "warning" | "info";

// Toast bilgileri
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  title?: string;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  createdAt: number;
}

// Toast Context tipi
interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "createdAt">) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Context oluşturma
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  // Durum
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Akış izleme
  useEffect(() => {
    const seqId = flowTracker.startSequence('ToastInitialization');
    
    logger.info(
      'Toast Provider başlatıldı',
      'ToastContext',
      'ToastContext.tsx',
      47
    );
    
    return () => {
      flowTracker.endSequence(seqId);
      logger.debug(
        'Toast Provider kaldırıldı',
        'ToastContext',
        'ToastContext.tsx',
        55
      );
    };
  }, []);
  
  // Toast ekle
  const addToast = useCallback(
    (toastData: Omit<Toast, "id" | "createdAt">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = {
        ...toastData,
        id,
        createdAt: Date.now(),
        autoClose: toastData.autoClose !== false, // Varsayılan olarak otomatik kapanır
        dismissible: toastData.dismissible !== false, // Varsayılan olarak kapatılabilir
        duration: toastData.duration || 5000, // Varsayılan süre: 5 saniye
      };
      
      logger.debug(
        `Yeni toast ekleniyor: ${newToast.type}`,
        'ToastContext.addToast',
        'ToastContext.tsx',
        73,
        { toast: { ...newToast, action: toastData.action ? 'Defined' : 'Undefined' } }
      );
      
      flowTracker.trackStep(
        'UI', 
        `Toast eklendi: ${newToast.type}`, 
        'ToastContext.addToast',
        { message: newToast.message, type: newToast.type }
      );
      
      setToasts((currentToasts) => [...currentToasts, newToast]);
      
      // Error toastlarını otomatik olarak ErrorService aracılığıyla izle
      if (newToast.type === 'error') {
        logger.warn(
          `Toast hata: ${newToast.message}`,
          'ToastContext.addToast.error',
          'ToastContext.tsx',
          88,
          { title: newToast.title }
        );
      }
      
      return id;
    },
    []
  );
  
  // Toast güncelle
  const updateToast = useCallback(
    (id: string, updates: Partial<Toast>) => {
      logger.debug(
        `Toast güncelleniyor: ${id}`,
        'ToastContext.updateToast',
        'ToastContext.tsx',
        102,
        { toastId: id, updates }
      );
      
      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id ? { ...toast, ...updates } : toast
        )
      );
      
      flowTracker.trackStep(
        'UI', 
        `Toast güncellendi: ${id}`, 
        'ToastContext.updateToast'
      );
    },
    []
  );
  
  // Toast kaldır
  const removeToast = useCallback(
    (id: string) => {
      logger.debug(
        `Toast kaldırılıyor: ${id}`,
        'ToastContext.removeToast',
        'ToastContext.tsx',
        124,
        { toastId: id }
      );
      
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id)
      );
      
      flowTracker.trackStep(
        'UI', 
        `Toast kaldırıldı: ${id}`, 
        'ToastContext.removeToast'
      );
    },
    []
  );
  
  // Tüm toastları temizle
  const clearToasts = useCallback(() => {
    logger.debug(
      'Tüm toastlar temizleniyor',
      'ToastContext.clearToasts',
      'ToastContext.tsx',
      143
    );
    
    setToasts([]);
    
    flowTracker.trackStep('UI', 'Tüm toastlar temizlendi', 'ToastContext.clearToasts');
  }, []);
  
  // Otomatik kapanan toastlar
  useEffect(() => {
    // Her toastun kendi zamanlayıcısını ayarla
    const timers = toasts
      .filter((toast) => toast.autoClose)
      .map((toast) => {
        return {
          id: toast.id,
          timer: setTimeout(() => {
            logger.debug(
              `Toast otomatik kapanıyor: ${toast.id}`,
              'ToastContext.autoClose',
              'ToastContext.tsx',
              162,
              { toastId: toast.id, duration: toast.duration }
            );
            
            removeToast(toast.id);
          }, toast.duration),
        };
      });
    
    // Temizleme işlevi
    return () => {
      timers.forEach((timer) => clearTimeout(timer.timer));
    };
  }, [toasts, removeToast]);
  
  // Context değeri
  const value = useMemo(
    () => ({
      toasts,
      addToast,
      updateToast,
      removeToast,
      clearToasts,
    }),
    [toasts, addToast, updateToast, removeToast, clearToasts]
  );
  
  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

// Toast hook
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    const error = new Error('useToast hook must be used within a ToastProvider');
    
    logger.error(
      'useToast hook ToastProvider dışında kullanıldı',
      'useToast',
      'ToastContext.tsx',
      199,
      { stack: error.stack }
    );
    
    throw error;
  }
  
  return context;
}

// Helper fonksiyonlar - Hook çağırmayan versiyonlar
// Bu fonksiyonlar, kullanıcı tarafından useToast kullanıldıktan sonra erişilebilir
export function createToastHelpers(toastContext: ToastContextType) {
  return {
    success: (message: string, options?: Partial<Omit<Toast, "id" | "createdAt" | "type" | "message">>) => {
      return toastContext.addToast({
        message,
        type: "success",
        ...options,
      });
    },

    error: (message: string, options?: Partial<Omit<Toast, "id" | "createdAt" | "type" | "message">>) => {
      return toastContext.addToast({
        message,
        type: "error",
        ...options,
      });
    },

    warning: (message: string, options?: Partial<Omit<Toast, "id" | "createdAt" | "type" | "message">>) => {
      return toastContext.addToast({
        message,
        type: "warning",
        ...options,
      });
    },

    info: (message: string, options?: Partial<Omit<Toast, "id" | "createdAt" | "type" | "message">>) => {
      return toastContext.addToast({
        message,
        type: "info",
        ...options,
      });
    },
  };
}

export default ToastContext;
