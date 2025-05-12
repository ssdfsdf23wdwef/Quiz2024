/**
 * Hata Yönetimi Servisi
 *
 * Bu servis, uygulama genelinde hata yönetimini sağlar.
 * Hataları loglama, kullanıcıya gösterme ve backend'e raporlama işlevlerini içerir.
 */

import { toast } from "react-hot-toast";

// Toast mesaj tipleri
export type ToastType = "success" | "error" | "warning" | "info";

// API hata seçenekleri
export interface ApiErrorOptions {
  status?: number;
  code?: string;
  original?: {
    error: unknown;
    context?: string;
    [key: string]: unknown;
  };
}

/**
 * API hatası oluşturmak için kullanılan sınıf
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  original?: unknown;
  context?: string;

  constructor(message: string, options?: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = options?.status || 500;
    this.code = options?.code;
    this.original = options?.original?.error;
    this.context = options?.original?.context;
  }
}

/**
 * Hata yönetim servisi
 */
export class ErrorService {
  /**
   * Hata mesajını konsola loglar
   */
  static logError(error: unknown, context?: string): void {
    if (error instanceof Error) {
      console.error(`[${context || "ERROR"}]`, error.message, error);
    } else {
      console.error(`[${context || "ERROR"}]`, error);
    }
  }

  /**
   * API hatası oluşturur
   */
  static createApiError(
    message: string,
    code?: string,
    options?: ApiErrorOptions,
  ): ApiError {
    return new ApiError(message, {
      ...options,
      code,
    });
  }

  /**
   * Toast mesajı gösterir
   */
  static showToast(message: string, type: ToastType = "info"): void {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast(message, {
          icon: "⚠️",
          style: {
            background: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #F59E0B",
          },
        });
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  }

  /**
   * Hata mesajını kullanıcıya gösterir
   */
  static handleError(error: unknown, context?: string): void {
    this.logError(error, context);

    let message = "Bir hata oluştu. Lütfen tekrar deneyin.";

    if (error instanceof ApiError) {
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    this.showToast(message, "error");
  }
}

export default ErrorService;
