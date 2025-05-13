"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { toast, ToastOptions } from "react-hot-toast";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
  dismissAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  // Toast gösterme fonksiyonu
  const showToast = (
    message: string,
    type: ToastType = "info",
    options?: ToastOptions
  ) => {
    const defaultOptions: ToastOptions = {
      duration: 4000,
      position: "top-right",
      ...options,
    };

    switch (type) {
      case "success":
        return toast.success(message, defaultOptions);
      case "error":
        return toast.error(message, defaultOptions);
      case "warning":
        return toast(message, {
          ...defaultOptions,
          icon: "⚠️",
          style: {
            background: "#FFF4E5",
            color: "#663C00",
            border: "1px solid #FFB020",
          },
        });
      case "info":
      default:
        return toast(message, {
          ...defaultOptions,
          icon: "ℹ️",
          style: {
            background: "#EDF7FF",
            color: "#0A2540",
            border: "1px solid #2684FF",
          },
        });
    }
  };

  // Toast kapatma fonksiyonu
  const dismissToast = (id: string) => {
    toast.dismiss(id);
  };

  // Tüm toastları kapatma
  const dismissAllToasts = () => {
    toast.dismiss();
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        dismissToast,
        dismissAllToasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

// Custom hook for using toast context
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}

export default ToastContext;
