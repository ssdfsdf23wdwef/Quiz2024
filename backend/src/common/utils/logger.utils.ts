/**
 * Logger Yardımcı Fonksiyonları
 * Bu dosya, uygulama genelinde kolay loglama için yardımcı fonksiyonlar içerir
 */

import { LoggerService } from '../services/logger.service';
import * as path from 'path';
import { FlowTrackerService } from '../services/flow-tracker.service';

const logger = LoggerService.getInstance();
const flowTracker = FlowTrackerService.getInstance();

flowTracker.track('Logger utils yükleniyor', 'logger.utils');

// Singleton logger instance
let loggerInstance: LoggerService | null = null;

/**
 * Logger servisini ayarlar
 * @param logger LoggerService örneği
 */
export function setLoggerInstance(logger: LoggerService): void {
  loggerInstance = logger;
}

/**
 * Mevcut dosya yolundan dosya adını çıkarır
 * @param filePath Tam dosya yolu
 * @returns Sadece dosya adı
 */
function extractFileName(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Hata kaydı - SADECE dosyaya yazılır, terminale yazılmaz
 * @param error Hata nesnesi
 * @param context Hatanın gerçekleştiği bağlam (sınıf, metod)
 * @param filePath Hatanın gerçekleştiği dosya yolu (__filename kullanılmalı)
 * @param lineNumber Hatanın gerçekleştiği satır numarası (opsiyonel)
 * @param additionalInfo Ek bilgiler (opsiyonel)
 */
export function logError(
  error: Error | string,
  context: string,
  filePath: string,
  lineNumber?: number,
  additionalInfo?: Record<string, any>,
): void {
  if (!loggerInstance) {
    console.error('Logger servisi başlatılmamış! Hata:', error);
    return;
  }

  const fileName = extractFileName(filePath);
  const errorMessage = typeof error === 'string' ? error : error.message;
  loggerInstance.error(
    errorMessage,
    context,
    fileName,
    lineNumber,
    typeof error === 'object' ? error : undefined,
    additionalInfo,
  );
}

/**
 * Program akışı izleme - SADECE terminale yazılır, dosyaya yazılmaz
 * @param message Akış mesajı
 * @param context Bağlam (sınıf, metod)
 */
export function logFlow(message: string, context: string): void {
  if (!loggerInstance) {
    console.log(
      `[AKIŞ] [${context}] ${message} (Logger servisi başlatılmamış)`,
    );
    return;
  }

  // flow metodu yerine info metodunu kullanıyoruz
  loggerInstance.info(`[AKIŞ] ${message}`, context);
}

/**
 * Çalışma zamanında mevcut dosya ve satır bilgisini almak için yardımcı fonksiyon
 * @returns {filePath: string, lineNumber: number} Dosya yolu ve satır numarası
 */
export function getCurrentFileInfo(): { filePath: string; lineNumber: number } {
  const stack = new Error().stack || '';
  const stackLines = stack.split('\n');

  // İlk satır hata mesajı, ikinci satır bu fonksiyon çağrısı, üçüncü satır çağıran fonksiyon
  const callerLine = stackLines[2] || '';

  // Satır bilgisini çıkar (format: "at Context.<anonymous> (file:line:column)")
  const match =
    callerLine.match(/\((.+):(\d+):(\d+)\)/) ||
    callerLine.match(/at\s+(.+):(\d+):(\d+)/);

  if (match && match.length >= 3) {
    return {
      filePath: match[1] || 'unknown',
      lineNumber: parseInt(match[2], 10) || 0,
    };
  }

  return {
    filePath: 'unknown',
    lineNumber: 0,
  };
}

/**
 * Çağrıdan dosya adı, satır numarası ve metod adını çıkaran yardımcı fonksiyon
 * @returns Dosya adı, satır numarası ve metod adı
 */
export function getCallerInfo(): {
  fileName: string;
  lineNumber: number;
  methodName: string;
} {
  try {
    flowTracker.trackStep('Çağrı bilgileri alınıyor', 'logger.utils');

    // Hata oluştur ve stack'i al
    const err = new Error();
    const stack = err.stack?.split('\n') || [];

    // 0: Error oluşturan satır
    // 1: getCallerInfo'yu çağıran fonksiyon
    // 2: getCallerInfo'yu çağıran fonksiyonu çağıran fonksiyon (hedefimiz)
    const callerLine = stack[3] || '';

    // Stack bilgisini parse et
    // at MethodName (/path/to/file.ts:lineNumber:columnNumber)
    const match = callerLine.match(/at\s+([^\s]+)\s+\(([^:]+):(\d+):(\d+)\)/);

    if (match) {
      const [, methodName, filePath, lineStr] = match;
      const fileName = path.basename(filePath);
      const lineNumber = parseInt(lineStr, 10);

      logger.debug(
        'Çağrı bilgileri başarıyla alındı',
        'logger.utils.getCallerInfo',
        __filename,
        38,
        { fileName, lineNumber, methodName },
      );

      return { fileName, lineNumber, methodName };
    }

    // Eşleşme bulunamazsa varsayılan değerler
    logger.warn(
      'Çağrı bilgileri alınamadı, varsayılan değerler kullanılıyor',
      'logger.utils.getCallerInfo',
      __filename,
      49,
    );

    return {
      fileName: 'unknown',
      lineNumber: 0,
      methodName: 'unknown',
    };
  } catch (error) {
    logger.logError(error, 'logger.utils.getCallerInfo', {
      additionalInfo: 'Çağrı bilgileri alınırken hata oluştu',
    });

    return {
      fileName: 'error',
      lineNumber: 0,
      methodName: 'error',
    };
  }
}

/**
 * Nesneyi güvenli bir şekilde string'e çevirir
 * Döngüsel referansları ve büyük nesneleri işler
 * @param obj String'e çevrilecek nesne
 * @param maxLength Maksimum uzunluk
 * @returns String temsilcisi
 */
export function safeStringify(obj: any, maxLength: number = 1000): string {
  try {
    flowTracker.trackStep(
      "Nesne güvenli biçimde string'e çevriliyor",
      'logger.utils',
    );

    // Zaten string ise kısalt ve döndür
    if (typeof obj === 'string') {
      if (obj.length > maxLength) {
        return `${obj.substring(0, maxLength)}... (${obj.length - maxLength} karakter daha)`;
      }
      return obj;
    }

    // Döngüsel referansları işlemek için cache
    const cache: any[] = [];

    const stringified = JSON.stringify(
      obj,
      (key, value) => {
        // Fonksiyonları string olarak göster
        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`;
        }

        // Döngüsel referansları kontrol et
        if (typeof value === 'object' && value !== null) {
          if (cache.includes(value)) {
            return '[Circular Reference]';
          }
          cache.push(value);
        }

        return value;
      },
      2,
    );

    // Çok büyükse kısalt
    if (stringified && stringified.length > maxLength) {
      logger.debug(
        'Nesne uzunluğu kısaltıldı',
        'logger.utils.safeStringify',
        __filename,
        112,
        {
          originalLength: stringified.length,
          truncatedLength: maxLength,
        },
      );

      return `${stringified.substring(0, maxLength)}... (${stringified.length - maxLength} karakter daha)`;
    }

    return stringified || '{}';
  } catch (error) {
    logger.logError(error, 'logger.utils.safeStringify', {
      additionalInfo: "Nesne string'e çevrilirken hata oluştu",
      object: typeof obj,
    });

    return '[Stringify Hatası]';
  }
}
