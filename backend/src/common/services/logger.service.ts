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
  lineNumber?: number;
  stack?: string;
  additionalInfo?: Record<string, any>;
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

  constructor() {
    // Log dizini oluşturma
    this.logDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.errorLogPath = path.join(this.logDir, 'error.log');

    // Uygulama başlatıldığında log dosyasını temizle
    this.clearLogFile();

    LoggerService.instance = this;
  }

  /**
   * Singleton pattern ile logger instance'ı döndürür
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Log dosyasını temizler
   */
  private clearLogFile(): void {
    fs.writeFileSync(this.errorLogPath, '', { encoding: 'utf8' });
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
    filePath?: string,
    lineNumber?: number,
    stack?: string,
    additionalInfo?: Record<string, any>,
  ): void {
    const timestamp = new Date().toISOString();

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      filePath,
      lineNumber,
      stack,
      additionalInfo,
    };

    const logString = `${JSON.stringify(logEntry)}\n`;

    // Log dosyasına asenkron olarak yaz
    fs.appendFile(this.errorLogPath, logString, (err) => {
      if (err) {
        // Burada console.error kullanıyoruz çünkü log mekanizmasının kendisi çalışmıyor
        console.error('Log dosyasına yazılırken hata oluştu:', err);
      }
    });
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
    filePath?: string,
    lineNumber?: number,
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
      additionalInfo,
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
    filePath?: string,
    lineNumber?: number,
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
    filePath?: string,
    lineNumber?: number,
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
    filePath?: string,
    lineNumber?: number,
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
   * @param additionalInfo Ek bilgiler
   */
  logError(
    error: Error,
    context: string,
    additionalInfo?: Record<string, any>,
  ): void {
    // Hata yığınından dosya yolu ve satır numarası çıkarma
    const stackLines = error.stack?.split('\n') || [];
    let filePath: string | undefined;
    let lineNumber: number | undefined;

    if (stackLines.length > 1) {
      // İlk satır hata mesajı, ikinci satır çağrı yığını
      const match = stackLines[1].match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        filePath = match[2];
        lineNumber = parseInt(match[3], 10);
      }
    }

    this.error(
      error.message,
      context,
      filePath,
      lineNumber,
      error,
      additionalInfo,
    );
  }
}
