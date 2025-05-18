import { LogClass, LogMethod } from "@/decorators/log-method.decorator";
import { toast } from "react-hot-toast";
import { getLogger, trackFlow } from "@/lib/logger.utils";
import { FlowCategory } from "@/constants/logging.constants";


// Logger nesnesi elde et
const logger = getLogger();

// Toast mesaj tipleri
export type ToastType = "success" | "error" | "warning" | "info";

// Hata tipleri
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Hata kaynakları
export enum ErrorSource {
  API = 'api',
  UI = 'ui',
  AUTH = 'auth',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

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

// Hata bilgileri arayüzü
export interface ErrorInfo {
  message: string;
  code?: string | number;
  source: ErrorSource;
  severity: ErrorSeverity;
  timestamp: number;
  userId?: string;
  context?: Record<string, unknown>;
  stack?: string;
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

// XMLHttpRequest için tip tanımı genişletmesi
declare global {
  interface XMLHttpRequest {
    _requestInfo?: {
      method: string;
      url: string | URL;
    };
  }
}

/**
 * Hata yönetim servisi
 * Uygulama genelinde hata izleme ve raporlama yönetimi
 */
@LogClass('ErrorService')
export class ErrorService {
  private errors: ErrorInfo[] = [];
  private readonly MAX_ERROR_HISTORY = 50;
  private reportingEndpoint?: string;
  
  constructor() {
    this.errors = [];
    
    // Üretim ortamında remote raporlama endpoint'i
    if (process.env.NODE_ENV === 'production') {
      this.reportingEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
    }
    
    getLogger().debug(
      'Hata servisi başlatıldı',
      'ErrorService.constructor',
      { 
        environment: process.env.NODE_ENV,
        reportingEnabled: !!this.reportingEndpoint 
      }
    );
    
    // Global hata yakalayıcıları kurulumu
    this.setupGlobalErrorHandlers();
    
    getLogger().info('ErrorService başlatıldı.', 'ErrorService.constructor');
  }
  
  /**
   * Global hata yakalayıcıları kur
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Javascript hataları için
      window.addEventListener('error', (event) => {
        this.handleUIError(event);
      });
      
      // Promise hataları için
      window.addEventListener('unhandledrejection', (event) => {
        this.handlePromiseError(event);
      });
      
      // Fetch API için orijinal fetch'i override et
      this.interceptFetchAPI();
      
      // XHR istekleri için orijinal XHR'ı override et
      this.interceptXHR();
      
      // Akış izleme - trackFlow fonksiyonunu kullan
      trackFlow('Global hata yakalayıcıları kuruldu', 'ErrorService.setupGlobalErrorHandlers', FlowCategory.Custom);
    }
  }
  
  /**
   * UI hatalarını yakala ve işle
   */
  private handleUIError(event: ErrorEvent): void {
    this.captureException(
      event.error || new Error(event.message),
      ErrorSource.UI,
      ErrorSeverity.HIGH,
      {
        fileName: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno
      }
    );
    
    // Akış izleme - trackFlow fonksiyonunu kullan
    trackFlow(`UI Hatası: ${event.message}`, 'ErrorService.handleUIError', FlowCategory.Error);
  }
  
  /**
   * Promise hatalarını yakala ve işle
   */
  private handlePromiseError(event: PromiseRejectionEvent): void {
    this.captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      ErrorSource.UI,
      ErrorSeverity.HIGH,
      { type: 'unhandledRejection' }
    );
    
    // Akış izleme - trackFlow fonksiyonunu kullan
    trackFlow(
      `Promise Hatası: ${event.reason instanceof Error ? event.reason.message : String(event.reason)}`,
      'ErrorService.handlePromiseError', 
      FlowCategory.Error
    );
  }
  
  /**
   * Fetch API isteklerini izle
   */
  private interceptFetchAPI(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // 400 ve 500 statü kodlarını hata olarak işle
        if (!response.ok) {
          try {
            const clonedResponse = response.clone();
            const errorData = await clonedResponse.json().catch(() => ({}));
            
            this.captureNetworkError({
              response: { 
                status: response.status, 
                statusText: response.statusText,
                data: errorData
              },
              request: { url: args[0], options: args[1] }
            });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_unused) {
            // JSON parse hatası olursa sessizce geç
          }
        }
        
        return response;
      } catch (error) {
        // Ağ hatası
        this.captureNetworkError({
          error,
          request: { url: args[0], options: args[1] }
        });
        throw error;
      }
    };
  }
  
  /**
   * XHR isteklerini izle
   */
  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const errorService = this; // this'i kaybetmemek için gerekli
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null): void {
      this._requestInfo = { method, url };
      return originalOpen.call(this, method, url, async, username || null, password || null);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      // Arrow fonksiyonlar kullanarak this bağlamını koruyoruz
      this.addEventListener('load', () => {
        if (this.status >= 400) {
          let errorData = {};
          try {
            errorData = JSON.parse(this.responseText);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_unused) {
            // JSON parse hatası sessizce geçilir
          }
          
          errorService.captureNetworkError({
            response: {
              status: this.status,
              statusText: this.statusText,
              data: errorData
            },
            request: { 
              url: this._requestInfo?.url,
              method: this._requestInfo?.method
            }
          });
        }
      });
      
      this.addEventListener('error', () => {
        errorService.captureNetworkError({
          error: new Error('XHR Network Error'),
          request: { 
            url: this._requestInfo?.url,
            method: this._requestInfo?.method
          }
        });
      });
      
      return originalSend.call(this, body);
    };
  }
  
  /**
   * Yeni hata kaydeder
   * @param errorInfo Hata bilgileri
   */
  @LogMethod('ErrorService', FlowCategory.Error)
  captureError(errorInfo: Omit<ErrorInfo, 'timestamp'>): ErrorInfo {
    const timestamp = Date.now();
    const fullErrorInfo: ErrorInfo = { ...errorInfo, timestamp };
    
    // Hata geçmişine ekle
    this.errors.push(fullErrorInfo);
    
    // Geçmiş boyutunu sınırla
    if (this.errors.length > this.MAX_ERROR_HISTORY) {
      this.errors.shift();
    }
    
    // Hatayı logla
    const logMethodMap = {
      [ErrorSeverity.LOW]: logger.debug.bind(logger),
      [ErrorSeverity.MEDIUM]: logger.warn.bind(logger),
      [ErrorSeverity.HIGH]: logger.error.bind(logger),
      [ErrorSeverity.CRITICAL]: logger.error.bind(logger)
    };
    
    const logMethod = logMethodMap[errorInfo.severity] || logger.error.bind(logger);
    
    logMethod(
      errorInfo.message,
      `ErrorService.captureError.${errorInfo.source}`,
      __filename,
      79,
      {
        errorCode: errorInfo.code,
        severity: errorInfo.severity,
        context: errorInfo.context
      }
    );
    
    // Akış izleme - trackFlow fonksiyonunu kullan
    trackFlow(
      `Hata: ${errorInfo.message}`, 
      `ErrorService.${errorInfo.source}`,
      FlowCategory.Error,
      {
        severity: errorInfo.severity,
        code: errorInfo.code
      }
    );
    
    // Hata dosyasına kaydet
    this.logErrorToFile(fullErrorInfo);
    
    // Kritik hatalar için kullanıcıya bildirim göster
    if (errorInfo.severity === ErrorSeverity.HIGH || 
        errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.showErrorToUser(fullErrorInfo);
    }
    
    // Kritik hatalar için uzak sunucuya bildirim
    if (errorInfo.severity === ErrorSeverity.HIGH || 
        errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.reportError(fullErrorInfo);
    }
    
    return fullErrorInfo;
  }
  
  /**
   * Hatayı log dosyasına yaz
   */
  private logErrorToFile(errorInfo: ErrorInfo): void {
    try {
      const { message, source, severity, code, stack } = errorInfo;
      const timestamp = new Date(errorInfo.timestamp).toISOString();
      
      const errorFormatted = {
        timestamp,
        level: this.mapSeverityToLogLevel(severity),
        message: `[${source.toUpperCase()}] ${message}`,
        context: `ErrorService.${source}`,
        metadata: {
          errorCode: code,
          severity,
          ...errorInfo.context
        },
        stack
      };
      
      // Logger servisini kullanarak dosyaya kaydet
      logger.error(
        errorFormatted.message,
        errorFormatted.context,
        undefined,
        undefined,
        errorFormatted.metadata
      );
    } catch (err) {
      console.error('Hata log dosyasına yazılırken sorun oluştu:', err);
    }
  }
  
  /**
   * Hata şiddetini log seviyesine dönüştürür
   */
  private mapSeverityToLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }
  
  /**
   * JS hata nesnesini yakalar ve servise kaydeder
   * @param error Hata nesnesi
   * @param source Hata kaynağı
   * @param severity Hata ciddiyeti
   * @param context Ek bağlam bilgileri
   */
  @LogMethod('ErrorService', FlowCategory.Error)
  captureException(
    error: Error | unknown, 
    source: ErrorSource = ErrorSource.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, unknown>
  ): ErrorInfo {
    // Error nesnesi mi kontrol et
    const isErrorObject = error instanceof Error;
    
    // Hata bilgilerini oluştur
    const errorInfo: Omit<ErrorInfo, 'timestamp'> = {
      message: isErrorObject ? error.message : String(error),
      code: isErrorObject && 'code' in error ? (error as { code?: string | number }).code : undefined,
      source,
      severity,
      context,
      stack: isErrorObject ? error.stack : undefined
    };
    
    // Mevcut kullanıcı ID'sini ekle
    try {
      const userJson = localStorage.getItem('auth-storage');
      if (userJson) {
        const userData = JSON.parse(userJson);
        if (userData?.state?.user?.id) {
          errorInfo.userId = userData.state.user.id;
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_unused) {
      // localStorage erişimi sırasında hata olursa sessizce devam et
    }
    
    return this.captureError(errorInfo);
  }
  
  /**
   * Ağ hatalarını yakalar (Fetch API veya Axios)
   * @param error Ağ hatası
   * @param context Ek bağlam bilgileri
   */
  @LogMethod('ErrorService', FlowCategory.Error)
  captureNetworkError(error: Record<string, unknown>, context?: Record<string, unknown>): ErrorInfo {
    // Axios hatası mı kontrol et
    const isAxiosError = error && error.isAxiosError;
    
    // Hata mesajını belirle
    let message = 'Ağ hatası';
    let code: string | number | undefined;
    let severity = ErrorSeverity.MEDIUM;
    
    if (isAxiosError) {
      // Axios hata detayları
      const response = error.response as { status?: number; data?: { message?: string } } | undefined;
      const status = response?.status;
      code = status || (error.code as string | number | undefined);
      message = response?.data?.message || (error.message as string) || message;
      
      // Durum koduna göre ciddiyet belirle
      if (status) {
        if (status >= 500) {
          severity = ErrorSeverity.HIGH;
        } else if (status === 401 || status === 403) {
          severity = ErrorSeverity.MEDIUM;
        } else if (status === 404) {
          severity = ErrorSeverity.LOW;
        }
      }
      
      // Bağlantı hatalarını yüksek ciddiyette işaretle
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        severity = ErrorSeverity.HIGH;
      }
    } else if ((error.error instanceof TypeError) && (error.error as TypeError).message.includes('fetch')) {
      // Fetch API hatası
      message = `Fetch hatası: ${(error.error as TypeError).message}`;
      severity = ErrorSeverity.HIGH;
    }
    
    return this.captureError({
      message,
      code,
      source: ErrorSource.NETWORK,
      severity,
      context: {
        ...context,
        url: isAxiosError ? (error.config as { url?: string })?.url : undefined,
        method: isAxiosError ? (error.config as { method?: string })?.method : undefined,
        status: isAxiosError ? (error.response as { status?: number })?.status : undefined
      }
    });
  }
  
  /**
   * Son hataları getirir
   * @param limit Maksimum hata sayısı
   */
  @LogMethod('ErrorService', FlowCategory.Custom)
  getRecentErrors(limit = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }
  
  /**
   * Belirli seviyedeki hataları getirir
   * @param severity Hata ciddiyeti
   * @param limit Maksimum hata sayısı 
   */
  getErrorsBySeverity(severity: ErrorSeverity, limit = 10): ErrorInfo[] {
    return this.errors
      .filter(error => error.severity === severity)
      .slice(-limit);
  }
  
  /**
   * Belirli bir kaynaktan gelen hataları getirir
   * @param source Hata kaynağı
   * @param limit Maksimum hata sayısı
   */
  getErrorsBySource(source: ErrorSource, limit = 10): ErrorInfo[] {
    return this.errors
      .filter(error => error.source === source)
      .slice(-limit);
  }
  
  /**
   * Tüm hata geçmişini temizler
   */
  clearErrorHistory(): void {
    this.errors = [];
    logger.debug('Hata geçmişi temizlendi', 'ErrorService.clearErrorHistory', __filename, 220);
  }
  
  /**
   * Hata dosyasını indirme
   */
  downloadErrorLog(): void {
    logger.downloadLogFile('error-logs.log');
    logger.debug('Hata log dosyası indirildi', 'ErrorService.downloadErrorLog', __filename);
  }
  
  /**
   * Kullanıcıya hata bildirimi göster
   * @param errorInfo Hata bilgileri
   */
  private showErrorToUser(errorInfo: ErrorInfo): void {
    try {
      // Toast bildirimini göster
      this.showToast(
        this.formatUserErrorMessage(errorInfo), 
        "error"
      );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_unused) {
      // Toast servisi hataları sessizce ele al
      logger.warn(
        'Hata bildirimi gösterilirken sorun oluştu',
        'ErrorService.showErrorToUser',
        __filename,
        247
      );
    }
  }
  
  /**
   * Kullanıcıya gösterilecek hata mesajını formatlar
   * @param errorInfo Hata bilgileri
   * @returns Formatlanmış hata mesajı
   */
  private formatUserErrorMessage(errorInfo: ErrorInfo): string {
    // Hata kodunu ekle
    const errorMessage = errorInfo.message;
    
    // Çok teknik mesajları basitleştir
    if (errorInfo.source === ErrorSource.NETWORK) {
      if (errorInfo.code === 'ECONNABORTED' || errorInfo.code === 'ERR_NETWORK') {
        return 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
      }
      
      if (errorInfo.code === 401 || errorInfo.code === 403) {
        return 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.';
      }
      
      if (errorInfo.code === 404) {
        return 'İstediğiniz kaynak bulunamadı.';
      }
      
      if (Number(errorInfo.code) >= 500) {
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      }
    }
    
    return errorMessage;
  }
  
  /**
   * Hatayı uzak sunucuya raporlar
   * @param errorInfo Hata bilgileri
   */
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    if (!this.reportingEndpoint) return;
    
    try {
      const response = await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorInfo),
        // Raporlama işlemi ana iş akışını etkilemesin
        signal: AbortSignal.timeout(5000) // 5 saniye zaman aşımı
      });
      
      if (!response.ok) {
        logger.warn(
          `Hata raporlama başarısız: ${response.status}`,
          'ErrorService.reportError',
          __filename,
          245,
          { status: response.status }
        );
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_unused) {
      // Raporlama sırasındaki hatalar sessizce ele alınır
      logger.warn(
        'Hata raporlama sırasında hata oluştu',
        'ErrorService.reportError',
        __filename, 
        255
      );
    }
  }
  
  /**
   * Tüm hataları bir log dosyasına kaydeder
   */
  saveErrorsToLogFile(): void {
    try {
      logger.debug(
        'Hata kayıtları log dosyasına yazılıyor',
        'ErrorService.saveErrorsToLogFile',
        __filename,
        267
      );
      
      // Her hatayı log servisine yaz
      for (const error of this.errors) {
        const logMessage = `${error.source.toUpperCase()} HATASI: ${error.message}`;
        const context = `ErrorService.${error.source}.${error.severity}`;
        
        // Severity'ye göre uygun log metodunu kullan
        switch (error.severity) {
          case ErrorSeverity.CRITICAL:
          case ErrorSeverity.HIGH:
            logger.error(logMessage, context, __filename, undefined, {
              code: error.code,
              userId: error.userId,
              timestamp: new Date(error.timestamp).toISOString(),
              context: error.context,
              stack: error.stack
            });
            break;
          case ErrorSeverity.MEDIUM:
            logger.warn(logMessage, context, __filename, undefined, {
              code: error.code,
              userId: error.userId,
              timestamp: new Date(error.timestamp).toISOString(),
              context: error.context
            });
            break;
          case ErrorSeverity.LOW:
            logger.debug(logMessage, context, __filename, undefined, {
              code: error.code,
              userId: error.userId,
              timestamp: new Date(error.timestamp).toISOString(),
              context: error.context
            });
            break;
        }
      }
      
      trackFlow(
        `${this.errors.length} hata kaydı dosyaya yazıldı`,
        'ErrorService.saveErrorsToLogFile',
        FlowCategory.Custom
      );
      
    } catch (error) {
      logger.error(
        'Hataları log dosyasına kaydetme hatası',
        'ErrorService.saveErrorsToLogFile',
        __filename,
        309,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

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
    // API hata mesajlarını daha kullanıcı dostu hale getir
    let friendlyMessage = message;
    
    // Belirli hata mesajlarını daha anlaşılır hale getir
    if (message.includes("Belge metni çok kısa veya boş")) {
      friendlyMessage = "Belge metni çok kısa. Lütfen daha uzun bir metin girin veya geçerli bir belge yükleyin.";
    }
    
    // Opsiyonel olarak API yanıtlarından gelen hata mesajlarını kullan
    if (options?.original?.error && 
        typeof options.original.error === 'object' &&
        'response' in options.original.error && 
        options.original.error.response) {
      
      const response = options.original.error.response as Record<string, unknown>;
      
      // API yanıtı içinde bir hata mesajı varsa
      if (response.data && typeof response.data === 'object' && 'message' in (response.data as object)) {
        const errorData = response.data as Record<string, unknown>;
        
        // API'den gelen hata mesajını kullan
        if (typeof errorData.message === 'string') {
          // Sistemsel hata mesajlarını kontrol et ve kullanıcı dostu hale getir
          if (errorData.message.includes("Belge metni çok kısa veya boş")) {
            friendlyMessage = "Belge metni çok kısa. Lütfen daha uzun bir metin girin veya geçerli bir belge yükleyin.";
          } else {
            // Diğer API hata mesajlarını doğrudan kullan
            friendlyMessage = errorData.message;
          }
        }
      }
    }
    
    return new ApiError(friendlyMessage, {
      ...options,
      code,
    });
  }

  /**
   * Toast mesajı gösterir
   */
  static showToast(error: Error | string, type: ToastType = "info", context?: string): void {
    // Hata mesajını belirle
    let message: string;
    let details: string | undefined;
    
    // Hata tipine göre işlem
    if (error instanceof Error) {
      // Hata objesinden bilgileri çıkart
      message = error.message;
      details = error.stack?.split('\n')[0];
      
      // Detaylı loglama
      console.error(`[${context || error.name}] ${message}`, error);
      
      // API hatası özel işleme
      if (error instanceof ApiError) {
        // API status koduna göre daha spesifik mesajlar
        if (error.status === 404) {
          message = `İstenen kaynak bulunamadı: ${message}`;
        } else if (error.status === 401) {
          message = "Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.";
        } else if (error.status === 403) {
          message = "Bu işlemi yapmaya yetkiniz yok.";
        } else if (error.status === 400) {
          message = `Hatalı istek: ${message}`;
        } else if (error.status >= 500) {
          message = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
        }
        
        // API yanıtından daha fazla bilgi al
        if (error.original && typeof error.original === 'object') {
          const apiError = error.original as any;
          if (apiError.response?.data?.message) {
            message = apiError.response.data.message;
          }
          if (apiError.response?.data?.error) {
            details = apiError.response.data.error;
          }
        }
      }
    } else {
      // String hatası
      message = error;
      console.log(`[${context || "INFO"}] ${message}`);
    }
    
    // Hata ayıklama için durum
    if (process.env.NODE_ENV === 'development' && details) {
      message = `${message}\n${details}`;
    }
    
    // Toast tipine göre gösterme
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message, {
          duration: 5000, // Hata mesajları için daha uzun süre
          style: {
            borderRadius: '10px',
            maxWidth: '500px',
            padding: '12px 16px'
          }
        });
        
        // Hata analytics için log tutma
        logger.error(
          new Error(message),
          'ErrorService.showToast',
          __filename,
          undefined,
          { context, type: "toast", details }
        );
        break;
      case "warning":
        toast(message, {
          icon: "⚠️",
          duration: 4000,
          style: {
            background: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #F59E0B",
            borderRadius: '10px'
          },
        });
        
        // Warning analytics için log tutma
        logger.warn(
          new Error(message),
          'ErrorService.showToast',
          __filename,
          undefined,
          { context, type: "toast", details }
        );
        break;
      case "info":
      default:
        toast(message);
        break;
    }
  }

  /**
   * Instance metod olarak toast mesaj göster
   */
  showToast(message: Error | string, type: ToastType = "info", context?: string): void {
    ErrorService.showToast(message, type, context);
  }

  /**
   * Hata mesajını kullanıcıya gösterir
   */
  static handleError(error: unknown, context?: string): void {
    ErrorService.logError(error, context);

    let errorObj: Error;

    if (error instanceof Error) {
      errorObj = error;
    } else if (typeof error === 'string') {
      errorObj = new Error(error);
    } else {
      errorObj = new Error("Bir hata oluştu. Lütfen tekrar deneyin.");
      // Verinin türü ve detayları hakkında ek context loglama
      console.log("[ERROR_DETAIL]", typeof error, error);
    }

    ErrorService.showToast(errorObj, "error", context);
  }
}

// Singleton instance oluştur ve export et
const errorService = new ErrorService();
export default errorService; 