/**
 * @file logger.service.ts
 * @description Frontend loglama servisi
 */

/**
 * Log seviyesi
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Loglayıcı konfigürasyonu
 */
interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  consoleOutput: boolean;
}

/**
 * Bir log girdisi
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Frontend Loglama Servisi
 * Uygulamada farklı seviyelerde logları kapsar
 */
export class LoggerService {
  private static instance: LoggerService;
  private config: LoggerConfig;
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enabled: config.enabled ?? process.env.NODE_ENV !== 'production',
      consoleOutput: config.consoleOutput ?? true,
    };
  }
  
  /**
   * Singleton instance oluşturma
   */
  public static getInstance(config?: Partial<LoggerConfig>): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(config);
    }
    return LoggerService.instance;
  }
  
  /**
   * Konfigürasyonu günceller
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Debug seviyesinde log
   */
  public debug(
    message: string,
    context?: string,
    error?: Error,
    stack?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.DEBUG, message, context, error, stack, metadata);
  }
  
  /**
   * Info seviyesinde log
   */
  public info(
    message: string,
    context?: string,
    error?: Error,
    stack?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.INFO, message, context, error, stack, metadata);
  }
  
  /**
   * Warn seviyesinde log
   */
  public warn(
    message: string,
    context?: string,
    error?: Error,
    stack?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.WARN, message, context, error, stack, metadata);
  }
  
  /**
   * Error seviyesinde log
   */
  public error(
    message: string,
    context?: string,
    error?: Error,
    stack?: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, message, context, error, stack, metadata);
  }
  
  /**
   * Log oluşturur
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    error?: Error,
    stack?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.config.enabled) {
      return;
    }
    
    // Log seviyesi kontrolü
    if (!this.shouldLog(level)) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      stack: stack || error?.stack,
      metadata
    };
    
    // Loglamayı gerçekleştir
    this.processLog(logEntry);
  }
  
  /**
   * Log kaydını işler
   */
  private processLog(entry: LogEntry): void {
    // Konsola yazdır
    if (this.config.consoleOutput) {
      this.writeToConsole(entry);
    }
    
    // LocalStorage'a kaydet
    this.saveToLocalStorage(entry);
  }
  
  /**
   * Log kaydını konsola yazdırır
   */
  private writeToConsole(entry: LogEntry): void {
    const consoleMethod = this.getConsoleMethod(entry.level);
    const timestamp = entry.timestamp.split('T')[1].slice(0, -1);
    const context = entry.context ? `[${entry.context}]` : '';
    
    // Mesaj ve bağlamı yazdır
    consoleMethod(`${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`);
    
    // Ek bilgileri yazdır
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      consoleMethod('Metadata:', entry.metadata);
    }
    
    // Stack trace varsa hata durumunda yazdır
    if (entry.stack && entry.level === LogLevel.ERROR) {
      console.error('Stack:', entry.stack);
    }
  }
  
  /**
   * Log kaydını localStorage'a kaydeder
   */
  private saveToLocalStorage(entry: LogEntry): void {
    if (typeof window === 'undefined') {
      return; // SSR sırasında localStorage yok, atla
    }
    
    try {
      // Hata logları için ayrı bir dosya kullan
      const isError = entry.level === LogLevel.ERROR;
      const storageKey = isError ? 'frontend-error.log' : 'frontend-flow-tracker.log';
      
      // Log satırını oluştur
      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`;
      
      // Mevcut logları al
      let logs = '';
      try {
        logs = localStorage.getItem(storageKey) || '';
      } catch {
        // localStorage okuma hatası - temiz başla
        logs = '';
      }
      
      // Ekle
      logs += logLine + '\n';
      
      // localStorage kapasitesi kontrolü - Max 100KB
      const MAX_SIZE = 100 * 1024;
      
      if (logs.length > MAX_SIZE) {
        // Sadece son 10KB'ı sakla
        logs = logs.substring(logs.length - 10 * 1024);
        const firstLineIndex = logs.indexOf('\n') + 1;
        if (firstLineIndex > 0) {
          logs = logs.substring(firstLineIndex);
        }
      }
      
      // Kaydet
      try {
        localStorage.setItem(storageKey, logs);
      } catch {
        // localStorage yazma hatası - eski logları temizle ve sadece bu logu kaydet
        try {
          localStorage.removeItem(storageKey);
          localStorage.setItem(storageKey, logLine + '\n');
        } catch {
          // Ciddi hata - sessizce devam et
        }
      }
    } catch {
      // Genel hata durumu - sessizce devam et
    }
  }
  
  /**
   * Konsolda kullanılacak metodu belirler
   */
  private getConsoleMethod(level: LogLevel): (message?: unknown, ...optionalParams: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }
  
  /**
   * Belirtilen log seviyesinin loglanıp loglanmayacağını belirler
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }
  
  /**
   * Kayıtlı tüm hata loglarını bir dizi halinde verir
   */
  public getAllErrorLogs(): string {
    try {
      const storageKey = 'frontend-error.log';
      return localStorage.getItem(storageKey) || '';
    } catch (error) {
      console.error('Log alma hatası:', error);
      return '';
    }
  }
  
  /**
   * Log geçmişini bir dizi olarak döndürür
   * Geriye dönük uyumluluk için eklenmiştir
   */
  public getLogHistory(): LogEntry[] {
    try {
      // İki log dosyasından log girişlerini al
      const errorLogs = localStorage.getItem('frontend-error.log') || '';
      const flowLogs = localStorage.getItem('frontend-flow-tracker.log') || '';
      
      // Tüm logları birleştir
      const allLogs = errorLogs + flowLogs;
      
      // Satırlara ayır ve LogEntry formatına dönüştür
      return allLogs
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const timestampMatch = line.match(/\[(.*?)\]/);
          const levelMatch = line.match(/\[(DEBUG|INFO|WARN|ERROR)\]/);
          const contextMatch = line.match(/\[(DEBUG|INFO|WARN|ERROR)\] \[(.*?)\]/);
          const message = line.replace(/\[.*?\] \[.*?\]( \[.*?\])?/, '').trim();
          
          return {
            timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
            level: levelMatch ? levelMatch[1].toLowerCase() as LogLevel : LogLevel.INFO,
            message: message,
            context: contextMatch ? contextMatch[2] : undefined
          };
        });
    } catch (error) {
      console.error('Log history alma hatası:', error);
      return [];
    }
  }
  
  /**
   * LocalStorage'daki tüm log içeriğini temizler
   */
  public clearAllLogs(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.removeItem('frontend-error.log');
      localStorage.removeItem('frontend-flow-tracker.log');
      console.log('Tüm loglar temizlendi');
    } catch (error) {
      console.error('Log temizleme hatası:', error);
    }
  }
} 