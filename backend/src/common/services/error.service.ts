import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { FlowTrackerService } from './flow-tracker.service';
import { LogMethod } from '../decorators/log-method.decorator';

/**
 * Hata yönetimi için servis
 * Bu servis, uygulama genelinde hataları yönetmek ve işlemek için kullanılır.
 */
@Injectable()
export class ErrorService {
  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {
    this.logger.debug(
      'ErrorService başlatıldı',
      'ErrorService.constructor',
      __filename,
      17,
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
    this.flowTracker.trackStep('Hata mesajı formatlanıyor', 'ErrorService');

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
      45,
      { errorName, errorMessage, context },
    );

    return formattedError;
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
    this.flowTracker.trackStep('Hata işleniyor', 'ErrorService');

    // Hatayı logla
    this.logger.logError(error, context, additionalInfo);

    // Kritik hataları izle ve gerektiğinde bildirim gönder
    if (this.isCriticalError(error)) {
      this.flowTracker.trackStep(
        'Kritik hata tespit edildi, bildirim gönderiliyor',
        'ErrorService',
      );
      this.notifyCriticalError(error, context);
    }
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
        103,
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
      128,
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
      146,
      { errorName: error.name, errorStack: error.stack },
    );

    // Bildirim gönderimi simüle edildi
    this.flowTracker.trackStep(
      'Kritik hata bildirimi gönderildi (simülasyon)',
      'ErrorService',
    );
  }
}
