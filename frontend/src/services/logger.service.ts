/**
 * @file logger.service.ts
 * @description Frontend için merkezi loglama sistemi
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LoggerOptions {
  appName?: string;
  enabled?: boolean;
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableRemote?: boolean;
  remoteUrl?: string;
  enableStackTrace?: boolean;
  // Dosya loglama seçenekleri
  enableFileLogging?: boolean;
  logFilePath?: string;
  maxLogSize?: number;
  rotateOnRestart?: boolean;
}

type LogMetadata = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  filePath?: string;
  lineNumber?: number;
  metadata?: LogMetadata;
  stackTrace?: string;
}

/**
 * LoggerService - Frontend loglama servisi
 * Farklı log seviyelerinde loglama yapabilir
 * Development ortamında detaylı bilgi, production ortamında sadece önemli loglar
 */
export class LoggerService {
  private static instance: LoggerService;
  private enabled: boolean;
  private minLevel: LogLevel;
  private appName: string;
  private enableConsole: boolean;
  private enableRemote: boolean;
  private remoteUrl?: string;
  private enableStackTrace: boolean;
  // Dosya loglama değişkenleri
  private enableFileLogging: boolean;
  private logFilePath: string;
  private maxLogSize: number;
  private rotateOnRestart: boolean;
  
  private logLevelValues: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4,
  };
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 1000;
  
  private constructor(options: LoggerOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.minLevel = options.minLevel ?? (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');
    this.appName = options.appName ?? 'StudySmart';
    this.enableConsole = options.enableConsole ?? true;
    this.enableRemote = options.enableRemote ?? false;
    this.remoteUrl = options.remoteUrl;
    this.enableStackTrace = options.enableStackTrace ?? process.env.NODE_ENV !== 'production';
    
    // Dosya loglama değişkenlerini başlat - varsayılan olarak aktif
    this.enableFileLogging = options.enableFileLogging ?? true;
    this.logFilePath = options.logFilePath ?? 'frontend-errors.log';
    this.maxLogSize = options.maxLogSize ?? 5 * 1024 * 1024; // 5 MB varsayılan
    this.rotateOnRestart = options.rotateOnRestart ?? true; // Varsayılan olarak true
    
    // Dosya loglaması etkinse ve uygulama yeniden başlatıldıysa log dosyasını temizle
    if (this.enableFileLogging && this.rotateOnRestart && typeof window !== 'undefined') {
      this.rotateLogFile();
    }
    
    // Window hatası yakalama
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error(
          `Yakalanmamış hata: ${event.message}`,
          'Global',
          undefined,
          undefined,
          { 
            fileName: event.filename,
            lineNo: event.lineno,
            colNo: event.colno,
            errorType: event.error?.name || 'Unknown'
          }
        );
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.error(
          `İşlenmeyen Promise hatası: ${event.reason?.message || event.reason || 'Bilinmeyen hata'}`,
          'Global',
          undefined,
          undefined,
          { reason: event.reason }
        );
      });

      console.log('📝 LoggerService başlatıldı - Tüm hatalar şu dosyaya kaydedilecek:', this.logFilePath);
    }
  }
  
  /**
   * Singleton instance oluşturma
   */
  public static getInstance(options?: LoggerOptions): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(options);
    } else if (options) {
      // Varolan instance yapılandırmasını güncelle
      LoggerService.instance.configure(options);
    }
    return LoggerService.instance;
  }
  
  /**
   * Log dosyasını temizler veya yenisini oluşturur
   */
  private rotateLogFile(): void {
    try {
      // Log dosyası rotasyonu için localStorage'da işaretçi kullan
      const lastCleanupKey = `log_cleanup_${this.logFilePath}`;
      localStorage.removeItem(lastCleanupKey); // Her başlangıçta temizle
      localStorage.setItem(this.logFilePath, ''); // Dosyayı temizle
      
      const now = new Date().toISOString();
      localStorage.setItem(lastCleanupKey, now); // Temizleme zamanını kaydet
      
      this.debug(
        `Log dosyası temizlendi: ${this.logFilePath}`, 
        'LoggerService.rotateLogFile',
        'logger.service.ts',
        114
      );
      
      console.log(`🧹 Log dosyası temizlendi: ${this.logFilePath}`);
    } catch (error) {
      console.error('Log dosyası temizlenirken hata oluştu:', error);
    }
  }
  
  /**
   * İki tarih arasındaki gün farkını hesaplar
   */
  private daysBetween(date1: Date, date2: Date): number {
    const ONE_DAY = 1000 * 60 * 60 * 24;
    const difference = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(difference / ONE_DAY);
  }
  
  /**
   * Log seviyesinin şu anki minimum seviyeye göre etkin olup olmadığını kontrol eder
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return this.enabled && this.logLevelValues[level] <= this.logLevelValues[this.minLevel];
  }
  
  /**
   * Bir log girdisi oluşturur
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): LogEntry {
    const timestamp = new Date().toISOString();
    let stackTrace: string | undefined;
    
    if (this.enableStackTrace && (level === 'error' || level === 'warn')) {
      const stack = new Error().stack;
      stackTrace = stack ? stack.split('\n').slice(3).join('\n') : undefined;
    }
    
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      filePath,
      lineNumber,
      metadata,
      stackTrace
    };
    
    return entry;
  }
  
  /**
   * Logu işler ve uygun çıktı kanallarına yönlendirir
   */
  private processLog(entry: LogEntry): void {
    // Log kaydı tutma
    this.logHistory.push(entry);
    
    // Maximum log sayısını aşınca en eskisini sil
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
    
    // Konsol log
    if (this.enableConsole) {
      // Sadece error ve warn dışında konsola yazdır
      // Burada hata ve uyarıları susturuyoruz, konsola akış bilgileri için sadece info ve debug
      if (entry.level !== 'error' && entry.level !== 'warn') {
        this.logToConsole(entry);
      }
    }
    
    // Hata loglarını dosyaya yaz
    if (this.enableFileLogging && (entry.level === 'error' || entry.level === 'warn')) {
      this.logToFile(entry);
    }
    
    // Uzak sunucuya log
    if (this.enableRemote) {
      this.sendToRemote(entry);
    }
  }
  
  /**
   * Konsola log yazdırma
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, metadata } = entry;
    const prefix = `[${timestamp.split('T')[1].slice(0, -1)}] [${level.toUpperCase()}]${context ? ` [${context}]` : ''}`;
    
    const args = [prefix, message];
    if (metadata && Object.keys(metadata).length > 0) {
      args.push(metadata as unknown as string);
    }
    
    switch (level) {
      // Hata ve uyarıları burada konsola yazdırmıyoruz
      case 'error':
        console.error(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'debug':
        console.debug(...args);
        break;
      case 'trace':
        console.trace(...args);
        break;
    }
  }
  
  /**
   * Dosyaya log yazma
   */
  private logToFile(entry: LogEntry): void {
    if (typeof window === 'undefined') {
      // SSR ortamında çalışıyoruz, dosya yazma işlemi yapılamaz
      return;
    }
    
    try {
      // Formatlanmış log metni oluştur
      const logText = this.formatLogEntry(entry);
      
      // Mevcut log dosyasını oku
      let existingLogs = localStorage.getItem(this.logFilePath) || '';
      
      // Boyut kontrolü yap
      if (existingLogs.length + logText.length > this.maxLogSize) {
        // Dosya boyutu sınırı aşıldı, eski logların bir kısmını (yarısını) sil
        existingLogs = existingLogs.substring(Math.floor(existingLogs.length / 2));
        
        // Dosyanın kesildiğini belirt
        const truncationMessage = `\n[${new Date().toISOString()}] [SYSTEM] Log dosyası boyutu sınırına ulaşıldı, eski loglar silindi.\n`;
        existingLogs = truncationMessage + existingLogs;
      }
      
      // Yeni logu ekle
      existingLogs += logText + '\n';
      
      // Log dosyasını güncelle
      localStorage.setItem(this.logFilePath, existingLogs);
      
      // Alternatif depolama: IndexedDB veya diğer bir mekanizma kullanılabilir
      // Daha büyük log dosyaları için IndexedDB tercih edilebilir
    } catch (error) {
      // Log yazma hatası, sessizce yoksay
      console.error('Log dosyasına yazma hatası:', error);
    }
  }
  
  /**
   * Log girişini formatlı metne dönüştürür
   */
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, filePath, lineNumber, metadata, stackTrace } = entry;
    
    // Temel log formatı
    let formattedLog = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Context bilgisi ekle
    if (context) {
      formattedLog += ` [${context}]`;
    }
    
    // Dosya ve satır bilgisi
    if (filePath) {
      formattedLog += ` [${filePath}${lineNumber ? `:${lineNumber}` : ''}]`;
    }
    
    // Log mesajı
    formattedLog += ` ${message}`;
    
    // Metadata bilgisi
    if (metadata && Object.keys(metadata).length > 0) {
      formattedLog += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    
    // Stack trace
    if (stackTrace) {
      formattedLog += `\nStack Trace:\n${stackTrace}`;
    }
    
    return formattedLog;
  }
  
  /**
   * Uzak sunucuya log gönderme
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.remoteUrl) return;
    
    try {
      const response = await fetch(this.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          appName: this.appName,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: entry.timestamp,
        }),
        // AbortSignal ile zaman aşımı belirle
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        console.error(`Uzak log sunucusuna gönderim başarısız: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // İstek hatası, sessizce yoksay
      console.error('Log gönderme hatası:', error);
    }
  }
  
  /**
   * Hata log seviyesinde loglama
   */
  public error(
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('error')) return;
    
    const entry = this.createLogEntry('error', message, context, filePath, lineNumber, metadata);
    this.processLog(entry);
  }
  
  /**
   * Uyarı log seviyesinde loglama
   */
  public warn(
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context, filePath, lineNumber, metadata);
    this.processLog(entry);
  }
  
  /**
   * Bilgi log seviyesinde loglama
   */
  public info(
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('info')) return;
    
    const entry = this.createLogEntry('info', message, context, filePath, lineNumber, metadata);
    this.processLog(entry);
  }
  
  /**
   * Debug log seviyesinde loglama
   */
  public debug(
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context, filePath, lineNumber, metadata);
    this.processLog(entry);
  }
  
  /**
   * Trace log seviyesinde loglama
   */
  public trace(
    message: string,
    context?: string,
    filePath?: string,
    lineNumber?: number,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('trace')) return;
    
    const entry = this.createLogEntry('trace', message, context, filePath, lineNumber, metadata);
    this.processLog(entry);
  }
  
  /**
   * Error nesnesinden log oluşturma
   */
  public logError(
    error: Error | string,
    context?: string,
    metadata?: LogMetadata
  ): void {
    if (!this.isLevelEnabled('error')) return;
    
    const errorObj = error instanceof Error ? error : new Error(error);
    
    const errorMetadata: LogMetadata = {
      ...(metadata || {}),
      name: errorObj.name,
      stack: errorObj.stack,
    };
    
    const entry = this.createLogEntry(
      'error',
      errorObj.message,
      context,
      undefined,
      undefined,
      errorMetadata
    );
    
    this.processLog(entry);
  }
  
  /**
   * Log geçmişini döndürür
   */
  public getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }
  
  /**
   * Logger yapılandırmasını günceller
   */
  public configure(options: Partial<LoggerOptions>): void {
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.minLevel !== undefined) this.minLevel = options.minLevel;
    if (options.appName !== undefined) this.appName = options.appName;
    if (options.enableConsole !== undefined) this.enableConsole = options.enableConsole;
    if (options.enableRemote !== undefined) this.enableRemote = options.enableRemote;
    if (options.remoteUrl !== undefined) this.remoteUrl = options.remoteUrl;
    if (options.enableStackTrace !== undefined) this.enableStackTrace = options.enableStackTrace;
    if (options.enableFileLogging !== undefined) this.enableFileLogging = options.enableFileLogging;
    if (options.logFilePath !== undefined) this.logFilePath = options.logFilePath;
    if (options.maxLogSize !== undefined) this.maxLogSize = options.maxLogSize;
    if (options.rotateOnRestart !== undefined) this.rotateOnRestart = options.rotateOnRestart;
  }
  
  /**
   * Log geçmişini temizler
   */
  public clearHistory(): void {
    this.logHistory = [];
  }
  
  /**
   * Log dosyasının içeriğini getirir
   */
  public getLogFileContent(): string {
    if (!this.enableFileLogging || typeof localStorage === 'undefined') return '';
    return localStorage.getItem(this.logFilePath) || '';
  }
  
  /**
   * Log dosyasını temizler
   */
  public clearLogFile(): void {
    if (!this.enableFileLogging || typeof localStorage === 'undefined') return;
    localStorage.setItem(this.logFilePath, '');
  }

  /**
   * Log dosyasını indirmek için içeriğini döndürür
   * @returns İndirilecek log dosyası içeriği
   */
  public downloadLogFile(filename?: string): void {
    try {
      const content = this.getLogFileContent();
      if (!content) {
        console.warn('İndirilecek log içeriği bulunamadı');
        return;
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${this.appName.toLowerCase()}-logs-${new Date().toISOString().slice(0, 10)}.log`;
      document.body.appendChild(a);
      a.click();
      
      // Temizlik
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      this.info(
        `Log dosyası indirildi: ${a.download}`,
        'LoggerService.downloadLogFile'
      );
    } catch (error) {
      console.error('Log dosyası indirilirken hata oluştu:', error);
    }
  }
} 