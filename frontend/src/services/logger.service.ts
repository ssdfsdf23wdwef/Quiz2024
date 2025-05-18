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
  sendLogsToApi?: boolean;
  maxLogSizeKB?: number;
  maxLogAgeDays?: number;
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
  private apiQueue: LogEntry[] = [];
  private apiDebounceTimer: number | null = null;
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enabled: config.enabled ?? process.env.NODE_ENV !== 'production',
      consoleOutput: config.consoleOutput ?? false, // Konsol çıktısını varsayılan olarak aktif yapıyorum
      sendLogsToApi: config.sendLogsToApi ?? false, // Backend'e log göndermeyi varsayılan olarak kapatıyorum
      maxLogSizeKB: config.maxLogSizeKB ?? 100,
      maxLogAgeDays: config.maxLogAgeDays ?? 7,
    };
    if (this.config.enabled && this.config.level === LogLevel.DEBUG) {
        console.debug("[LoggerService] LoggerService başlatıldı. Config:", JSON.stringify(this.config));
    }
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
    if (this.config.consoleOutput) {
      this.writeToConsole(entry);
    }
    this.saveToLocalStorage(entry);
    if (this.config.sendLogsToApi) {
      this.scheduleSendToBackend(entry);
    }
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
      return;
    }
    try {
      // frontend-flow-tracker.log anahtarı FlowTrackerService tarafından da kullanılıyor olabilir.
      // LoggerService'in tüm logları (info, warn, debug) bu dosyaya yazması, flow loglarıyla karışabilir.
      // Sadece ERROR seviyesindeki loglar için frontend-error.log, diğerleri için genel bir frontend.log kullanılabilir.
      // Şimdilik mevcut mantıkla devam edelim: hatalar ayrı, diğerleri (info, warn, debug) frontend-flow-tracker.log'a gidiyor gibi.
      // Bu mantık LoggerService için karışık. LoggerService sadece kendi loglarını yönetmeli.
      // saveToLocalStorage şimdilik sadece ERROR loglarını frontend-error.log'a, diğerlerini (INFO, WARN, DEBUG) frontend-general.log gibi bir dosyaya yazsın.
      // YA DA, FlowTrackerService logları kendi dosyasına, LoggerService logları kendi dosyasına yazsın.
      // LoggerService.saveToLocalStorage, entry.level'e göre farklı storageKey kullanabilir.
      // frontend-error.log -> sadece LoggerService.error() çağrıları için.
      // frontend-debug.log -> sadece LoggerService.debug() çağrıları için.
      // frontend-info.log -> sadece LoggerService.info() çağrıları için.
      // frontend-warn.log -> sadece LoggerService.warn() çağrıları için.

      // Basitleştirilmiş yaklaşım: Tüm logları tek bir yerde topla (hata logları hariç)
      const storageKey = entry.level === LogLevel.ERROR ? 'frontend-error.log' : 'frontend-general.log';

      const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`;
      
      let logs = '';
      try {
        logs = localStorage.getItem(storageKey) || '';
      } catch (e) {
        // this.warn değil, çünkü this.warn da saveToLocalStorage çağırabilir.
        console.warn(`[LoggerService] LocalStorage (${storageKey}) okuma hatası, loglar sıfırlanıyor:`, e);
        logs = '';
      }
      
      logs += logLine + '\n';
      
      const MAX_SIZE = (this.config.maxLogSizeKB ?? 100) * 1024;
      if (logs.length > MAX_SIZE) {
        const tenPercentKB = Math.max(10, Math.floor((this.config.maxLogSizeKB ?? 100) / 10)); // En az 10KB veya %10'u
        const cutPoint = logs.length - (tenPercentKB * 1024);
        logs = logs.substring(cutPoint > 0 ? cutPoint : 0);
        const firstLineIndex = logs.indexOf('\n') + 1;
        if (firstLineIndex > 0 && firstLineIndex < logs.length) {
          logs = logs.substring(firstLineIndex);
        }
        // this.info değil, basit console.info
        console.info(`[LoggerService] LocalStorage (${storageKey}) kapasitesi aşıldı, eski loglar kırpıldı.`);
      }
      
      try {
        localStorage.setItem(storageKey, logs);
      } catch (e) {
        console.warn(`[LoggerService] LocalStorage (${storageKey}) yazma hatası. Loglar temizlenip sadece mevcut log kaydedilecek:`, e);
        try {
          localStorage.removeItem(storageKey);
          localStorage.setItem(storageKey, logLine + '\n');
        } catch (finalError) {
          console.error(`[LoggerService] LocalStorage (${storageKey}) yazma sırasında kritik hata:`, finalError);
        }
      }
    } catch (e) {
      console.error('[LoggerService] saveToLocalStorage genel hata:', e);
    }
  }
  
  /**
   * Log seviyesine göre konsol metodunu döndürür
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
   * Mevcut log seviyesine göre loglama yapılıp yapılmayacağını kontrol eder
   */
  public shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
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

  private scheduleSendToBackend(entry: LogEntry): void {
    if (typeof window === 'undefined') {
      return;
    }
    this.apiQueue.push(entry);
    if (this.apiDebounceTimer) {
      clearTimeout(this.apiDebounceTimer);
    }
    this.apiDebounceTimer = window.setTimeout(() => { 
      this.sendQueuedLogsToBackend();
    }, 3000);
  }

  private async sendQueuedLogsToBackend(): Promise<void> {
    if (!this.config.sendLogsToApi || this.apiQueue.length === 0) {
      return;
    }
    
    try {
      const logsToSend = [...this.apiQueue];
      this.apiQueue = []; // Kuyruğu temizle

      // Logları API endpoint'e gönder
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logsToSend),
      });

      if (!response.ok) {
        const responseText = await response.text();
        console.warn(`[LoggerService] Loglar dosyaya kaydedilemedi. Status: ${response.status}`, responseText);
        
        // Log kaydı başarısız olduğunda, yedekleme olarak konsola yazdır
        logsToSend.forEach(log => {
          console.log(`[${log.timestamp}] [${log.level.toUpperCase()}] ${log.context ? `[${log.context}]` : ''} ${log.message}`);
        });
      } else {
        if (this.shouldLog(LogLevel.DEBUG)) {
          console.debug(`[LoggerService] ${logsToSend.length} log başarıyla dosyaya kaydedildi.`);
        }
      }
    } catch (error) {
      console.error('[LoggerService] Loglar dosyaya kaydedilirken hata oluştu:', error);
    }
  }
} 