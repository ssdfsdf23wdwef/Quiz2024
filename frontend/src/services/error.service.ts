import { getLogger, getFlowTracker } from "@/lib/logger.utils";
import { LogClass, LogMethod } from "@/decorators/log-method.decorator";

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

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

// Hata bilgileri arayüzü
export interface ErrorInfo {
  message: string;
  code?: string | number;
  source: ErrorSource;
  severity: ErrorSeverity;
  timestamp: number;
  userId?: string;
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Hata yönetim servisi
 * Uygulama genelinde hata izleme ve raporlama yönetimi
 */
@LogClass('ErrorService')
class ErrorService {
  private errors: ErrorInfo[] = [];
  private readonly MAX_ERROR_HISTORY = 50;
  private reportingEndpoint?: string;
  
  constructor() {
    this.errors = [];
    
    // Üretim ortamında remote raporlama endpoint'i
    if (process.env.NODE_ENV === 'production') {
      this.reportingEndpoint = process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT;
    }
    
    logger.debug(
      'Hata servisi başlatıldı',
      'ErrorService.constructor',
      __filename,
      46,
      { 
        environment: process.env.NODE_ENV,
        reportingEnabled: !!this.reportingEndpoint 
      }
    );
  }
  
  /**
   * Yeni hata kaydeder
   * @param errorInfo Hata bilgileri
   */
  @LogMethod('ErrorService', 'Error')
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
    
    // Akış izleme
    flowTracker.trackStep(
      'Error', 
      `Hata: ${errorInfo.message}`, 
      `ErrorService.${errorInfo.source}`,
      {
        severity: errorInfo.severity,
        code: errorInfo.code
      }
    );
    
    // Kritik hatalar için uzak sunucuya bildirim
    if (errorInfo.severity === ErrorSeverity.HIGH || 
        errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.reportError(fullErrorInfo);
    }
    
    return fullErrorInfo;
  }
  
  /**
   * JS hata nesnesini yakalar ve servise kaydeder
   * @param error Hata nesnesi
   * @param source Hata kaynağı
   * @param severity Hata ciddiyeti
   * @param context Ek bağlam bilgileri
   */
  @LogMethod('ErrorService', 'Error')
  captureException(
    error: Error | unknown, 
    source: ErrorSource = ErrorSource.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): ErrorInfo {
    // Error nesnesi mi kontrol et
    const isErrorObject = error instanceof Error;
    
    // Hata bilgilerini oluştur
    const errorInfo: Omit<ErrorInfo, 'timestamp'> = {
      message: isErrorObject ? error.message : String(error),
      code: isErrorObject && 'code' in error ? (error as any).code : undefined,
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
    } catch (e) {
      // localStorage erişimi sırasında hata olursa sessizce devam et
    }
    
    return this.captureError(errorInfo);
  }
  
  /**
   * Ağ hatalarını yakalar (Fetch API veya Axios)
   * @param error Ağ hatası
   * @param context Ek bağlam bilgileri
   */
  @LogMethod('ErrorService', 'Error')
  captureNetworkError(error: any, context?: Record<string, any>): ErrorInfo {
    // Axios hatası mı kontrol et
    const isAxiosError = error && error.isAxiosError;
    
    // Hata mesajını belirle
    let message = 'Ağ hatası';
    let code: string | number | undefined;
    let severity = ErrorSeverity.MEDIUM;
    
    if (isAxiosError) {
      // Axios hata detayları
      const status = error.response?.status;
      code = status || error.code;
      message = error.response?.data?.message || error.message || message;
      
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
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // Fetch API hatası
      message = `Fetch hatası: ${error.message}`;
      severity = ErrorSeverity.HIGH;
    }
    
    return this.captureError({
      message,
      code,
      source: ErrorSource.NETWORK,
      severity,
      context: {
        ...context,
        url: isAxiosError ? error.config?.url : undefined,
        method: isAxiosError ? error.config?.method : undefined,
        status: isAxiosError ? error.response?.status : undefined
      }
    });
  }
  
  /**
   * Son hataları getirir
   * @param limit Maksimum hata sayısı
   */
  @LogMethod('ErrorService', 'Info')
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
   * Tüm hata geçmişini temizler
   */
  clearErrorHistory(): void {
    this.errors = [];
    logger.debug('Hata geçmişi temizlendi', 'ErrorService.clearErrorHistory', __filename, 220);
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
          { status: response.status, errorInfo }
        );
      }
    } catch (error) {
      // Raporlama sırasındaki hatalar sessizce ele alınır
      logger.warn(
        'Hata raporlama sırasında hata oluştu',
        'ErrorService.reportError',
        __filename, 
        255,
        { error }
      );
    }
  }
}

// Singleton instance oluştur ve export et
const errorService = new ErrorService();
export default errorService; 