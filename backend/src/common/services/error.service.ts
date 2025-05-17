import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { FlowTrackerService, FlowCategory } from './flow-tracker.service';
import { LogMethod } from '../decorators/log-method.decorator';

/**
 * Hata ciddiyet seviyeleri
 */
export enum ErrorSeverity {
  LOW = 'low', // Düşük önemli hatalar
  MEDIUM = 'medium', // Orta önemli hatalar
  HIGH = 'high', // Yüksek önemli hatalar
  CRITICAL = 'critical', // Kritik hatalar
}

/**
 * Hata kaynakları
 */
export enum ErrorSource {
  API = 'api', // API çağrılarından kaynaklanan hatalar
  UI = 'ui', // UI bileşenlerinden kaynaklanan hatalar
  AUTH = 'auth', // Kimlik doğrulama hatalar
  NETWORK = 'network', // Ağ hatalar
  DB = 'db', // Veritabanı hatalar
  VALIDATION = 'validation', // Doğrulama hatalar
  UNKNOWN = 'unknown', // Bilinmeyen kaynaklı hatalar
}

/**
 * Hata bilgisi
 */
export interface ErrorInfo {
  message: string;
  source: ErrorSource;
  severity: ErrorSeverity;
  code?: string | number;
  timestamp: number;
  context?: string;
  stack?: string;
  userId?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Hata yönetimi için servis
 * Bu servis, uygulama genelinde hataları yönetmek ve işlemek için kullanılır.
 */
@Injectable()
export class ErrorService {
  private errors: ErrorInfo[] = [];
  private readonly MAX_ERROR_COUNT = 100;
  private readonly allowedContexts: Set<string>;

  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {
    // Sadece belirli context'lerde loglama/izleme yapılmasını sağla
    const allowed = process.env.ERROR_CONTEXTS
      ? process.env.ERROR_CONTEXTS.split(',').map((s) => s.trim())
      : ['AuthService'];
    this.allowedContexts = new Set(allowed);
    this.logger.debug(
      'ErrorService başlatıldı',
      'ErrorService.constructor',
      __filename,
      57,
    );
  }

  /**
   * Hata mesajını formatlayarak döndürür
   * @param error Hata nesnesi
   * @param context Hata bağlamı (sınıf/metod adı)
   * @returns Formatlanmış hata mesajı
   */
  @LogMethod()
  formatError(error: Error, context: string): string {
    if (
      this.allowedContexts.size > 0 &&
      (!context || !this.allowedContexts.has(context))
    ) {
      return '';
    }
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      'Hata mesajı formatlanıyor',
      'ErrorService',
    );

    // Hata nesnesinden bilgileri çıkar
    const errorName = error.name || 'Error';
    const errorMessage = error.message || 'Bilinmeyen hata';
    const stackInfo = this.extractStackInfo(error);

    // Formatlanmış hata mesajı
    const formattedError = `[${errorName}] ${errorMessage} (${context})${
      stackInfo ? ` - ${stackInfo}` : ''
    }`;

    this.logger.debug(
      'Hata mesajı formatlandı',
      'ErrorService.formatError',
      __filename,
      82,
      { errorName, errorMessage, context },
    );

    return formattedError;
  }

  /**
   * Hatayı yakalar ve kaydeder
   * @param error Hata nesnesi veya mesajı
   * @param source Hata kaynağı
   * @param severity Hata ciddiyeti
   * @param context Bağlam bilgisi
   * @param additionalInfo Ek bilgiler
   * @returns Kaydedilen hata bilgisi
   */
  @LogMethod()
  captureError(
    error: Error | string,
    source: ErrorSource = ErrorSource.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    additionalInfo?: Record<string, any>,
  ): ErrorInfo {
    if (
      this.allowedContexts.size > 0 &&
      (!context || !this.allowedContexts.has(context))
    ) {
      return {
        message: typeof error === 'string' ? error : error.message,
        source,
        severity,
        timestamp: Date.now(),
        context,
        stack: typeof error === 'string' ? undefined : error.stack,
        additionalInfo,
      };
    }
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      `${source.toUpperCase()} hatası yakalandı: ${typeof error === 'string' ? error : error.message}`,
      'ErrorService',
    );

    const timestamp = Date.now();
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const errorInfo: ErrorInfo = {
      message: errorObj.message,
      source,
      severity,
      timestamp,
      context,
      stack: errorObj.stack,
      additionalInfo,
    };

    // Hata listesine ekle
    this.errors.push(errorInfo);

    // Maksimum hata sayısını aşınca en eskisini sil
    if (this.errors.length > this.MAX_ERROR_COUNT) {
      this.errors.shift();
    }

    // Hatayı log dosyasına yaz
    this.logErrorToFile(errorInfo);

    return errorInfo;
  }

  /**
   * Hatayı işler ve uygun aksiyonu alır
   * @param error Hata nesnesi
   * @param context Hata bağlamı (sınıf/metod adı)
   * @param additionalInfo Ek bilgiler
   */
  @LogMethod()
  handleError(
    error: Error,
    context: string,
    additionalInfo?: Record<string, any>,
  ): void {
    if (
      this.allowedContexts.size > 0 &&
      (!context || !this.allowedContexts.has(context))
    ) {
      return;
    }
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      'Hata işleniyor',
      'ErrorService',
    );

    // Hatayı yakala ve kaydet
    this.captureError(
      error,
      ErrorSource.UNKNOWN,
      ErrorSeverity.MEDIUM,
      context,
      additionalInfo,
    );

    // Kritik hataları izle ve gerektiğinde bildirim gönder
    if (this.isCriticalError(error)) {
      this.flowTracker.trackCategory(
        FlowCategory.Error,
        'Kritik hata tespit edildi, bildirim gönderiliyor',
        'ErrorService',
      );
      this.notifyCriticalError(error, context);
    }
  }

  /**
   * API hatalarını yakalar
   * @param error Hata nesnesi
   * @param endpoint API endpoint bilgisi
   * @param context Bağlam bilgisi
   * @returns Kaydedilen hata bilgisi
   */
  @LogMethod()
  captureApiError(
    error: Error | string,
    endpoint: string,
    context?: string,
  ): ErrorInfo {
    const additionalInfo = { endpoint };
    return this.captureError(
      error,
      ErrorSource.API,
      ErrorSeverity.MEDIUM,
      context,
      additionalInfo,
    );
  }

  /**
   * Ağ hatalarını yakalar
   * @param error Hata nesnesi
   * @param url İstek URL'i
   * @param context Bağlam bilgisi
   * @returns Kaydedilen hata bilgisi
   */
  @LogMethod()
  captureNetworkError(
    error: Error | string,
    url?: string,
    context?: string,
  ): ErrorInfo {
    const additionalInfo = url ? { url } : undefined;
    return this.captureError(
      error,
      ErrorSource.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      additionalInfo,
    );
  }

  /**
   * Veritabanı hatalarını yakalar
   * @param error Hata nesnesi
   * @param operation Veritabanı işlemi
   * @param context Bağlam bilgisi
   * @returns Kaydedilen hata bilgisi
   */
  @LogMethod()
  captureDbError(
    error: Error | string,
    operation?: string,
    context?: string,
  ): ErrorInfo {
    const additionalInfo = operation ? { operation } : undefined;
    return this.captureError(
      error,
      ErrorSource.DB,
      ErrorSeverity.HIGH,
      context,
      additionalInfo,
    );
  }

  /**
   * Son hataları getirir
   * @param limit Maksimum hata sayısı
   * @returns Hata listesi
   */
  @LogMethod()
  getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  /**
   * Belirli bir kaynaktan gelen hataları getirir
   * @param source Hata kaynağı
   * @param limit Maksimum hata sayısı
   * @returns Filtrelenmiş hata listesi
   */
  @LogMethod()
  getErrorsBySource(source: ErrorSource, limit: number = 10): ErrorInfo[] {
    return this.errors.filter((error) => error.source === source).slice(-limit);
  }

  /**
   * Belirli şiddetteki hataları getirir
   * @param severity Hata şiddeti
   * @param limit Maksimum hata sayısı
   * @returns Filtrelenmiş hata listesi
   */
  @LogMethod()
  getErrorsBySeverity(
    severity: ErrorSeverity,
    limit: number = 10,
  ): ErrorInfo[] {
    return this.errors
      .filter((error) => error.severity === severity)
      .slice(-limit);
  }

  /**
   * Hata geçmişini temizler
   */
  @LogMethod()
  clearErrorHistory(): void {
    this.errors = [];
    this.logger.debug(
      'Hata geçmişi temizlendi',
      'ErrorService.clearErrorHistory',
      __filename,
      235,
    );
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      'Hata geçmişi temizlendi',
      'ErrorService',
    );
  }

  /**
   * Tüm hataları log dosyasına kaydeder
   */
  @LogMethod()
  saveErrorsToFile(): void {
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      'Hatalar dosyaya kaydediliyor',
      'ErrorService',
    );

    for (const error of this.errors) {
      this.logErrorToFile(error);
    }

    this.logger.info(
      `${this.errors.length} hata kaydı dosyaya yazıldı`,
      'ErrorService.saveErrorsToFile',
      __filename,
      250,
    );
  }

  /**
   * Hata yığınından dosya adı ve satır numarası gibi bilgileri çıkarır
   * @param error Hata nesnesi
   * @returns Stack bilgisi
   */
  private extractStackInfo(error: Error): string | null {
    try {
      const stackLines = error.stack?.split('\n') || [];
      if (stackLines.length > 1) {
        // İlk satır hata mesajı, ikinci satırdan itibaren çağrı yığını
        const match = stackLines[1].match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
          const [, methodName, filePath, lineNumber] = match;
          return `${methodName} (${filePath}:${lineNumber})`;
        }
      }
      return null;
    } catch (extractError) {
      this.logger.warn(
        'Hata yığını bilgisi çıkarılırken sorun oluştu',
        'ErrorService.extractStackInfo',
        __filename,
        275,
        { originalError: error.message },
      );
      return null;
    }
  }

  /**
   * Hatanın kritik olup olmadığını kontrol eder
   * @param error Hata nesnesi
   * @returns Kritik hata mı?
   */
  private isCriticalError(error: Error): boolean {
    // Belirli hata türlerini kritik olarak işaretle
    const criticalErrorTypes = [
      'DatabaseError',
      'ConnectionError',
      'AuthenticationError',
      'SystemError',
    ];

    const isCritical = criticalErrorTypes.includes(error.name);

    this.logger.debug(
      `Hata kritiklik kontrolü: ${isCritical ? 'Kritik' : 'Normal'}`,
      'ErrorService.isCriticalError',
      __filename,
      300,
      { errorName: error.name },
    );

    return isCritical;
  }

  /**
   * Kritik hatalar için bildirim gönderir
   * @param error Hata nesnesi
   * @param context Hata bağlamı
   */
  private notifyCriticalError(error: Error, context: string): void {
    // Burada gerçek bir bildirim mekanizması entegre edilebilir (e-posta, SMS, vb.)
    this.logger.warn(
      `KRİTİK HATA: ${error.message} (${context})`,
      'ErrorService.notifyCriticalError',
      __filename,
      317,
      { errorName: error.name, errorStack: error.stack },
    );

    // Bildirim gönderimi simüle edildi
    this.flowTracker.trackCategory(
      FlowCategory.Error,
      'Kritik hata bildirimi gönderildi (simülasyon)',
      'ErrorService',
    );
  }

  /**
   * Hata bilgisini log dosyasına yazar
   * @param errorInfo Hata bilgisi
   */
  private logErrorToFile(errorInfo: ErrorInfo): void {
    try {
      const { message, source, severity, context, stack } = errorInfo;

      const logMessage = `[${source.toUpperCase()}] [${severity.toUpperCase()}] ${message}`;
      const logContext = context || `ErrorService.${source}`;

      // Hata şiddetine göre uygun log seviyesini kullan
      switch (severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          this.logger.error(
            logMessage,
            logContext,
            __filename,
            undefined,
            new Error(message),
            errorInfo.additionalInfo,
          );
          break;
        case ErrorSeverity.MEDIUM:
          this.logger.warn(
            logMessage,
            logContext,
            __filename,
            undefined,
            errorInfo.additionalInfo,
          );
          break;
        case ErrorSeverity.LOW:
          this.logger.info(
            logMessage,
            logContext,
            __filename,
            undefined,
            errorInfo.additionalInfo,
          );
          break;
      }
    } catch (err) {
      // Loglama sırasında oluşan hatayı bastır
      this.logger.error(
        'Hata log dosyasına yazılırken sorun oluştu',
        'ErrorService.logErrorToFile',
        __filename,
        undefined,
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }
}
