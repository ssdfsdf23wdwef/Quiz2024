import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

/**
 * Hata kayıt seviyesi
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Hata kayıt formatı
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: string;
  filePath?: string;
  lineNumber?: string;
  stack?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Logger yapılandırma seçenekleri
 */
export interface LoggerOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  logToFile?: boolean;
  logDir?: string;
  errorLogPath?: string;
  clearLogsOnStartup?: boolean;
  minLevel?: LogLevel;
}

/**
 * Hata kayıt servisi
 * Bu servis, uygulama içinde oluşan hataları belirli bir formatta log dosyasına kaydeder.
 * Hata kayıtları terminale yazdırılmaz, sadece log dosyasına yazılır.
 */
@Injectable()
export class LoggerService {
  private readonly logDir: string;
  private readonly errorLogPath: string;
  private static instance: LoggerService;
  private readonly enabled: boolean;
  private readonly logToConsole: boolean;
  private readonly logToFile: boolean;
  private readonly minLevel: LogLevel;

  constructor(options?: LoggerOptions) {
    // Seçenekleri başlat
    this.enabled = options?.enabled ?? true;
    this.logToConsole =
      options?.logToConsole ?? process.env.NODE_ENV !== 'production';
    this.logToFile = options?.logToFile ?? true; // Dosya loglaması varsayılan olarak aktif
    this.minLevel =
      options?.minLevel ??
      (process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG);

    // Log dizini oluşturma
    this.logDir = options?.logDir ?? path.join(process.cwd(), 'logs');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.errorLogPath =
      options?.errorLogPath ?? path.join(this.logDir, 'error.log');

    // Uygulama başlatıldığında log dosyasını temizle
    if (this.logToFile && (options?.clearLogsOnStartup ?? true)) {
      this.clearLogFile();
    }

    LoggerService.instance = this;
  }

  /**
   * Singleton pattern ile logger instance'ı döndürür
   */
  public static getInstance(options?: LoggerOptions): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(options);
    }
    return LoggerService.instance;
  }

  /**
   * Log dosyasını temizler
   */
  clearLogFile(): void {
    if (this.logToFile) {
      try {
        fs.writeFileSync(this.errorLogPath, '', { encoding: 'utf8' });
        if (this.logToConsole) {
          console.log(`🧹 Log dosyası temizlendi: ${this.errorLogPath}`);
        }
      } catch (err) {
        console.error('Log dosyası temizlenirken hata oluştu:', err);
      }
    }
  }

  /**
   * Log dosyasının içeriğini getirir
   */
  getLogFileContent(): string {
    if (!this.logToFile) {
      return '';
    }

    try {
      return fs.readFileSync(this.errorLogPath, { encoding: 'utf8' });
    } catch (err) {
      console.error('Log dosyası okunurken hata oluştu:', err);
      return '';
    }
  }

  /**
   * Log dosyasını indirmek için içeriğini döndürür
   * @returns Buffer olarak log dosyası içeriği
   */
  getLogFileBuffer(): Buffer {
    if (!this.logToFile) {
      return Buffer.from('');
    }

    try {
      return fs.readFileSync(this.errorLogPath);
    } catch (err) {
      console.error('Log dosyası okunurken hata oluştu:', err);
      return Buffer.from('');
    }
  }

  /**
   * Hata kaydı oluşturur
   * @param level Hata seviyesi
   * @param message Hata mesajı
   * @param context Hatanın oluştuğu bağlam (sınıf/metod adı)
   * @param filePath Hatanın oluştuğu dosya yolu
   * @param lineNumber Hatanın oluştuğu satır numarası
   * @param stack Hata yığını
   * @param additionalInfo Ek bilgiler
   */
  private log(
    level: LogLevel,
    message: string,
    context: string,
    filePath?: string | number,
    lineNumber?: string | number,
    stack?: string,
    additionalInfo?: Record<string, any>,
  ): void {
    // Log seviyeleri için minimum seviye kontrolü
    const levelValues: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 3,
      [LogLevel.WARN]: 2,
      [LogLevel.INFO]: 1,
      [LogLevel.DEBUG]: 0,
    };

    if (!this.enabled || levelValues[level] < levelValues[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();

    // Number tipindeki değerleri string'e çevir
    const filePathStr = filePath !== undefined ? String(filePath) : undefined;
    const lineNumberStr =
      lineNumber !== undefined ? String(lineNumber) : undefined;

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      filePath: filePathStr,
      lineNumber: lineNumberStr,
      stack,
      additionalInfo,
    };

    // Konsola log
    if (this.logToConsole) {
      this.logToConsoleFormatted(logEntry);
    }

    // Dosyaya log
    if (this.logToFile) {
      // Geliştirilmiş log formatı
      const formattedEntry = this.formatLogEntryForFile(logEntry);
      // Log dosyasına asenkron olarak yaz
      fs.appendFile(this.errorLogPath, formattedEntry, (err) => {
        if (err) {
          // Burada console.error kullanıyoruz çünkü log mekanizmasının kendisi çalışmıyor
          console.error('Log dosyasına yazılırken hata oluştu:', err);
        }
      });
    }
  }

  /**
   * Log girdisini konsola formatlanmış şekilde yazar
   */
  private logToConsoleFormatted(entry: LogEntry): void {
    const { timestamp, level, message, context, filePath, lineNumber } = entry;
    const time = timestamp.split('T')[1].slice(0, -1);
    let logFn = console.log;

    // Renk ve log fonksiyonu seçimi
    switch (level) {
      case LogLevel.ERROR:
        logFn = console.error;
        break;
      case LogLevel.WARN:
        logFn = console.warn;
        break;
      case LogLevel.INFO:
        logFn = console.info;
        break;
      case LogLevel.DEBUG:
        logFn = console.debug;
        break;
    }

    const locationInfo = filePath
      ? ` (${filePath}${lineNumber ? `:${lineNumber}` : ''})`
      : '';
    logFn(
      `[${time}] [${level.toUpperCase()}] [${context}]${locationInfo} ${message}`,
    );

    // Eğer ek bilgiler varsa onları da yazdır
    if (entry.additionalInfo && Object.keys(entry.additionalInfo).length > 0) {
      logFn('Additional Info:', entry.additionalInfo);
    }

    // Eğer stack bilgisi varsa onu da yazdır
    if (entry.stack) {
      logFn('Stack Trace:', entry.stack);
    }
  }

  /**
   * Log girdisini dosya için formatlar
   */
  private formatLogEntryForFile(entry: LogEntry): string {
    // JSON formatında log kayıtları
    return JSON.stringify(entry) + '\n';
  }

  /**
   * Hata seviyesinde log kaydı oluşturur
   * @param message Hata mesajı
   * @param context Hatanın oluştuğu bağlam (sınıf/metod adı)
   * @param filePath Hatanın oluştuğu dosya yolu
   * @param lineNumber Hatanın oluştuğu satır numarası
   * @param error Hata nesnesi
   * @param additionalInfo Ek bilgiler
   */
  error(
    message: string,
    context: string,
    filePath?: string | number,
    lineNumber?: string | number,
    error?: Error,
    additionalInfo?: Record<string, any>,
  ): void {
    this.log(
      LogLevel.ERROR,
      message,
      context,
      filePath,
      lineNumber,
      error?.stack,
      additionalInfo
        ? { ...additionalInfo, errorName: error?.name }
        : { errorName: error?.name },
    );
  }

  /**
   * Uyarı seviyesinde log kaydı oluşturur
   * @param message Uyarı mesajı
   * @param context Uyarının oluştuğu bağlam (sınıf/metod adı)
   * @param filePath Uyarının oluştuğu dosya yolu
   * @param lineNumber Uyarının oluştuğu satır numarası
   * @param additionalInfo Ek bilgiler
   */
  warn(
    message: string,
    context: string,
    filePath?: string | number,
    lineNumber?: string | number,
    additionalInfo?: Record<string, any>,
  ): void {
    this.log(
      LogLevel.WARN,
      message,
      context,
      filePath,
      lineNumber,
      undefined,
      additionalInfo,
    );
  }

  /**
   * Bilgi seviyesinde log kaydı oluşturur
   * @param message Bilgi mesajı
   * @param context Bilginin oluştuğu bağlam (sınıf/metod adı)
   * @param filePath Bilginin oluştuğu dosya yolu
   * @param lineNumber Bilginin oluştuğu satır numarası
   * @param additionalInfo Ek bilgiler
   */
  info(
    message: string,
    context: string,
    filePath?: string | number,
    lineNumber?: string | number,
    additionalInfo?: Record<string, any>,
  ): void {
    this.log(
      LogLevel.INFO,
      message,
      context,
      filePath,
      lineNumber,
      undefined,
      additionalInfo,
    );
  }

  /**
   * Debug seviyesinde log kaydı oluşturur
   * @param message Debug mesajı
   * @param context Debug bilgisinin oluştuğu bağlam (sınıf/metod adı)
   * @param filePath Debug bilgisinin oluştuğu dosya yolu
   * @param lineNumber Debug bilgisinin oluştuğu satır numarası
   * @param additionalInfo Ek bilgiler
   */
  debug(
    message: string,
    context: string,
    filePath?: string | number,
    lineNumber?: string | number,
    additionalInfo?: Record<string, any>,
  ): void {
    this.log(
      LogLevel.DEBUG,
      message,
      context,
      filePath,
      lineNumber,
      undefined,
      additionalInfo,
    );
  }

  /**
   * Hata nesnesinden otomatik olarak log kaydı oluşturur
   * @param error Hata nesnesi
   * @param context Hatanın oluştuğu bağlam (sınıf/metod adı)
   * @param filePathOrAdditionalInfo Hatanın oluştuğu dosya yolu veya ek bilgiler (opsiyonel)
   * @param lineNumberOrAdditionalInfo Hatanın oluştuğu satır numarası veya ek bilgiler (opsiyonel)
   * @param additionalInfo Ek bilgiler (opsiyonel)
   */
  logError(
    error: Error,
    context: string,
    filePathOrAdditionalInfo?: string | number | Record<string, any>,
    lineNumberOrAdditionalInfo?: string | number | Record<string, any>,
    additionalInfo?: Record<string, any>,
  ): void {
    // Hata yığınından dosya yolu ve satır numarası çıkarma
    const stackLines = error.stack?.split('\n') || [];
    let filePath: string | undefined;
    let extractedLineNumber: string | undefined;

    if (stackLines.length > 1) {
      // İlk satır hata mesajı, ikinci satır çağrı yığını
      const match = stackLines[1].match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        filePath = match[2];
        extractedLineNumber = match[3];
      }
    }

    // Parametreleri doğru tipe dönüştürme
    let filePathStr: string | number | undefined;
    let lineNumberStr: string | number | undefined;
    let mergedAdditionalInfo: Record<string, any> = {};

    // filePathOrAdditionalInfo parametresini işle
    if (filePathOrAdditionalInfo !== undefined) {
      if (
        typeof filePathOrAdditionalInfo === 'string' ||
        typeof filePathOrAdditionalInfo === 'number'
      ) {
        // String veya sayı ise dosya yolu olarak kullan
        filePathStr = filePathOrAdditionalInfo;
      } else if (typeof filePathOrAdditionalInfo === 'object') {
        // Obje ise ek bilgi olarak kullan
        mergedAdditionalInfo = {
          ...mergedAdditionalInfo,
          ...filePathOrAdditionalInfo,
        };
      }
    }

    // lineNumberOrAdditionalInfo parametresini işle
    if (lineNumberOrAdditionalInfo !== undefined) {
      if (
        typeof lineNumberOrAdditionalInfo === 'string' ||
        typeof lineNumberOrAdditionalInfo === 'number'
      ) {
        // String veya sayı ise satır numarası olarak kullan
        lineNumberStr = lineNumberOrAdditionalInfo;
      } else if (typeof lineNumberOrAdditionalInfo === 'object') {
        // Obje ise ek bilgi olarak kullan
        mergedAdditionalInfo = {
          ...mergedAdditionalInfo,
          ...lineNumberOrAdditionalInfo,
        };
      }
    }

    // Son ek bilgileri ekle
    if (additionalInfo) {
      mergedAdditionalInfo = { ...mergedAdditionalInfo, ...additionalInfo };
    }

    // Dosya yolu olarak önce parametre olarak gelen, yoksa stackten çıkarılan değeri kullan
    const finalFilePath = filePathStr || filePath;

    // Satır numarası olarak önce parametre olarak gelen, yoksa stackten çıkarılan değeri kullan
    const finalLineNumber = lineNumberStr || extractedLineNumber;

    this.error(
      error.message,
      context,
      finalFilePath,
      finalLineNumber,
      error,
      Object.keys(mergedAdditionalInfo).length > 0
        ? mergedAdditionalInfo
        : undefined,
    );
  }
}
