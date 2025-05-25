import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger, format, transports } from 'winston';

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
 * Bu servis, uygulama içinde olu�Yan hataları belirli bir formatta log dosyasına kaydeder.
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
  private readonly allowedContexts: Set<string>;
  private readonly performanceMarks: Record<
    string,
    {
      label: string;
      startTime: number;
      memory: NodeJS.MemoryUsage;
    }
  > = {};

  /**
   * Sınav olu�Yturma i�Ylemlerini loglamak için kullanılan logger
   */
  public examProcessLogger: any;


  public learningTargetLogger: any;

  /**
   * Sınav olu�Yturma a�Yamalarını kaydetmek için özel bir logger
   */
  private initExamProcessLogger() {
    // �-nce log dizininin var oldu�Yundan emin olalım
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o777 });
        console.log(`�Y"? Log dizini olu�Yturuldu: ${this.logDir}`);
      }

      // Sınav log dosyasını kontrol et ve gerekirse olu�Ytur
      const sinavLogPath = path.join(this.logDir, 'sinav-olusturma.log');
      if (!fs.existsSync(sinavLogPath)) {
        fs.writeFileSync(sinavLogPath, '', { encoding: 'utf8', mode: 0o666 });
        console.log(`�Y"" Sınav log dosyası olu�Yturuldu: ${sinavLogPath}`);
      } else {
        // Dosya var ama yazılabilir mi kontrol et
        try {
          fs.accessSync(sinavLogPath, fs.constants.W_OK);
        } catch (err) {
          console.error(
            `�?O Sınav log dosyası yazılabilir de�Yil: ${sinavLogPath}`,
            err,
          );
          // Dosya izinlerini düzeltmeye çalı�Y
          fs.chmodSync(sinavLogPath, 0o666);
          console.log(
            `�Y"� Sınav log dosyası izinleri düzeltildi: ${sinavLogPath}`,
          );
        }
      }
    } catch (err) {
      console.error(
        '�?O Sınav log dizini veya dosyası hazırlanırken hata:',
        err,
      );
    }

    // Logger'ı olu�Ytur
    return createLogger({
      level: 'debug',
      format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        }),
      ),
      transports: [
        new transports.File({
          filename: path.join(this.logDir, 'sinav-olusturma.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          tailable: true,
          handleExceptions: true,
          // Dosya eri�Yim sorunlarını çözmek için ek ayarlar
          options: {
            flags: 'a',
            encoding: 'utf8',
            mode: 0o666,
          },
        }),
        // Konsola da yazdırmak için
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.printf(({ timestamp, level, message }) => {
              return `[SINAV] [${timestamp}] [${level}] ${message}`;
            }),
          ),
        }),
      ],
    });
  }

  /**
   * �-�Yrenme hedefleri i�Ylemlerini kaydetmek için özel bir logger
   */
  private initLearningTargetLogger() {
    // �-nce log dizininin var oldu�Yundan emin olalım
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o777 });
        console.log(`�Y"? Log dizini olu�Yturuldu: ${this.logDir}`);
      }

      // �-�Yrenme hedefleri log dosyasını kontrol et ve gerekirse olu�Ytur
      const learningTargetLogPath = path.join(this.logDir, 'ö�Yrenme_hedef.log');
      if (!fs.existsSync(learningTargetLogPath)) {
        fs.writeFileSync(learningTargetLogPath, '', { encoding: 'utf8', mode: 0o666 });
        console.log(`�Y"? �-�Yrenme hedefleri log dosyası olu�Yturuldu: ${learningTargetLogPath}`);
      } else {
        // Dosya var ama yazılabilir mi kontrol et
        try {
          fs.accessSync(learningTargetLogPath, fs.constants.W_OK);
        } catch (err) {
          console.error(
            `�?O �-�Yrenme hedefleri log dosyası yazılabilir de�Yil: ${learningTargetLogPath}`,
            err,
          );
          // Dosya izinlerini düzeltmeye çalı�Y
          fs.chmodSync(learningTargetLogPath, 0o666);
          console.log(
            `�Y"� �-�Yrenme hedefleri log dosyası izinleri düzeltildi: ${learningTargetLogPath}`,
          );
        }
      }

      // �-�Yrenme hedefleri logger'ını olu�Ytur
      this.learningTargetLogger = createLogger({
        level: 'debug',
        format: format.combine(
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.printf(({ level, message, timestamp, ...meta }) => {
            return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message} ${Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : ''}`;
          }),
        ),
        transports: [
          new transports.File({
            filename: learningTargetLogPath,
            level: 'debug',
          }),
          // Konsola da yazmak için
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf(({ level, message, timestamp, ...meta }) => {
                return `[�-�Yrenme Hedef] [${timestamp}] [${level}] ${message} ${Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''}`;
              }),
            ),
          }),
        ],
      });

      console.log(`�Y'� �-�Yrenme hedefleri logger'ı ba�Yarıyla olu�Yturuldu`);
    } catch (error) {
      console.error('�?O �-�Yrenme hedefleri logger olu�Yturulurken hata:', error);
    }
  }

  constructor(options?: LoggerOptions) {
    // Seçenekleri ba�Ylat
    this.enabled = options?.enabled ?? true;
    this.logToConsole = options?.logToConsole ?? true;
    this.logToFile = options?.logToFile ?? true;
    this.logDir = options?.logDir ?? 'logs';
    this.errorLogPath = options?.errorLogPath ?? 'logs/error.log';
    this.minLevel = options?.minLevel ?? LogLevel.DEBUG;
    this.allowedContexts = new Set(['*']); // Varsayılan: tüm context'ler izinli

    // Singleton instance'ı ayarla
    LoggerService.instance = this;

    // Log dizinini olu�Ytur
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Sınav süreci logger'ını ba�Ylat
    this.examProcessLogger = this.initExamProcessLogger();

    // �-�Yrenme hedefleri logger'ını ba�Ylat
    this.learningTargetLogger = this.initLearningTargetLogger();

    // Uygulama ba�Ylatıldı�Yında log dosyasını temizle
    if (this.logToFile && (options?.clearLogsOnStartup ?? true)) {
      this.clearLogFile();
    }
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
      } catch (err) {
        // console.error('Log dosyası temizlenirken hata olu�Ytu:', err);
      }
    }
  }

  /**
   * Log dosyasının içeri�Yini getirir
   */
  getLogFileContent(): string {
    if (!this.logToFile) {
      return '';
    }

    try {
      return fs.readFileSync(this.errorLogPath, { encoding: 'utf8' });
    } catch (err) {
      // console.error('Log dosyası okunurken hata olu�Ytu:', err);
      return '';
    }
  }

  /**
   * Log dosyasını indirmek için içeri�Yini döndürür
   * @returns Buffer olarak log dosyası içeri�Yi
   */
  getLogFileBuffer(): Buffer {
    if (!this.logToFile) {
      return Buffer.from('');
    }

    try {
      return fs.readFileSync(this.errorLogPath);
    } catch (err) {
      // console.error('Log dosyası okunurken hata olu�Ytu:', err);
      return Buffer.from('');
    }
  }

  /**
   * Hata kaydı olu�Yturur
   * @param level Hata seviyesi
   * @param message Hata mesajı
   * @param context Hatanın olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePath Hatanın olu�Ytu�Yu dosya yolu
   * @param lineNumber Hatanın olu�Ytu�Yu satır numarası
   * @param stack Hata yı�Yını
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

    // Sadece izin verilen context'lerde loglama yap
    if (
      this.allowedContexts.size > 0 &&
      !this.allowedContexts.has('*') &&
      !this.allowedContexts.has(context)
    ) {
      // console.log(`[Logger] Context '${context}' loglanmıyor (izin yok)`);
      return;
    }

    if (!this.enabled || levelValues[level] < levelValues[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();

    // Number tipindeki de�Yerleri string'e çevir
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
      // Geli�Ytirilmi�Y log formatı
      const formattedEntry = this.formatLogEntryForFile(logEntry);
      // Log dosyasını belirle
      const logFilePath = this.getLogFileName(level);

      // Geçerli bir dosya yolu varsa log dosyasına asenkron olarak yaz
      if (logFilePath) {
        fs.appendFile(logFilePath, formattedEntry, (err) => {
          if (err) {
            // Burada console.error kullanıyoruz çünkü log mekanizmasının kendisi çalı�Ymıyor
            // Konsolda görünmemesi için yorum haline getirdim
            // console.error(
            //   `Log dosyasına yazılırken hata olu�Ytu (${logFilePath}):`,
            //   err,
            // );
          }
          // else {
          //   console.log(`[Logger] Log dosyasına yazıldı: ${logFilePath}`);
          // }
        });
      } else {
        // console.error('[Logger] Geçerli bir log dosya yolu belirlenemedi:', {
        //   level,
        // });
      }
    }
  }

  /**
   * Log girdisini konsola formatlanmı�Y �Yekilde yazar
   */
  private logToConsoleFormatted(entry: LogEntry): void {
    // Konsola loglama devre dı�Yı - bu metod artık loglama yapmıyor
    // Backend logları dosyalara kaydedilir, gerekirse arayüz ile görüntülenebilir

    // Loglama tamamen kapatılmasın, çok önemli hatalar için açalım
    if (
      entry.level === LogLevel.ERROR &&
      process.env.NODE_ENV === 'development'
    ) {
      const { timestamp, level, message, context, filePath, lineNumber } =
        entry;
      const time = timestamp.split('T')[1].slice(0, -1);
      const locationInfo = filePath
        ? ` (${filePath}${lineNumber ? `:${lineNumber}` : ''})`
        : '';

      console.error(
        `[${time}] [${level.toUpperCase()}] [${context}]${locationInfo} ${message}`,
      );
    }
  }

  /**
   * Log girdisini dosya için formatlar
   */
  private formatLogEntryForFile(entry: LogEntry): string {
    // Okunabilir, güzel formatta log kaydı
    const {
      timestamp,
      level,
      message,
      context,
      filePath,
      lineNumber,
      stack,
      additionalInfo,
    } = entry;
    const date = new Date(timestamp);
    const formattedTime = `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour12: false })}`;
    const fileInfo = filePath
      ? ` (${filePath}${lineNumber ? `:${lineNumber}` : ''})`
      : '';
    let log = `[${formattedTime}] [${level.toUpperCase()}] [${context}]${fileInfo} ${message}`;
    if (stack) {
      log += `\nStack Trace:\n${stack}`;
    }
    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
      log += `\nEk Bilgi: ${JSON.stringify(additionalInfo)}`;
    }
    log += `\n------------------------------------------------------------\n`;
    return log;
  }

  /**
   * Hata seviyesinde log kaydı olu�Yturur
   * @param message Hata mesajı
   * @param context Hatanın olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePath Hatanın olu�Ytu�Yu dosya yolu
   * @param lineNumber Hatanın olu�Ytu�Yu satır numarası
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
   * Uyarı seviyesinde log kaydı olu�Yturur
   * @param message Uyarı mesajı
   * @param context Uyarının olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePath Uyarının olu�Ytu�Yu dosya yolu
   * @param lineNumber Uyarının olu�Ytu�Yu satır numarası
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
   * Bilgi seviyesinde log kaydı olu�Yturur
   * @param message Bilgi mesajı
   * @param context Bilginin olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePath Bilginin olu�Ytu�Yu dosya yolu
   * @param lineNumber Bilginin olu�Ytu�Yu satır numarası
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
   * Debug seviyesinde log kaydı olu�Yturur
   * @param message Debug mesajı
   * @param context Debug bilgisinin olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePath Debug bilgisinin olu�Ytu�Yu dosya yolu
   * @param lineNumber Debug bilgisinin olu�Ytu�Yu satır numarası
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
   * Hata nesnesinden otomatik olarak log kaydı olu�Yturur
   * @param error Hata nesnesi
   * @param context Hatanın olu�Ytu�Yu ba�Ylam (sınıf/metod adı)
   * @param filePathOrAdditionalInfo Hatanın olu�Ytu�Yu dosya yolu veya ek bilgiler (opsiyonel)
   * @param lineNumberOrAdditionalInfo Hatanın olu�Ytu�Yu satır numarası veya ek bilgiler (opsiyonel)
   * @param additionalInfo Ek bilgiler (opsiyonel)
   */
  logError(
    error: Error,
    context: string,
    filePathOrAdditionalInfo?: string | number | Record<string, any>,
    lineNumberOrAdditionalInfo?: string | number | Record<string, any>,
    additionalInfo?: Record<string, any>,
  ): void {
    // Hata yı�Yınından dosya yolu ve satır numarası çıkarma
    const stackLines = error.stack?.split('\n') || [];
    let filePath: string | undefined;
    let extractedLineNumber: string | undefined;

    if (stackLines.length > 1) {
      // İlk satır hata mesajı, ikinci satır ça�Yrı yı�Yını
      const match = stackLines[1].match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        filePath = match[2];
        extractedLineNumber = match[3];
      }
    }

    // Parametreleri do�Yru tipe dönü�Ytürme
    let filePathStr: string | number | undefined;
    let lineNumberStr: string | number | undefined;
    let mergedAdditionalInfo: Record<string, any> = {};

    // filePathOrAdditionalInfo parametresini i�Yle
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

    // lineNumberOrAdditionalInfo parametresini i�Yle
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

    // Dosya yolu olarak önce parametre olarak gelen, yoksa stackten çıkarılan de�Yeri kullan
    const finalFilePath = filePathStr || filePath;

    // Satır numarası olarak önce parametre olarak gelen, yoksa stackten çıkarılan de�Yeri kullan
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

  /**
   * Detaylı hata yı�Yınını (stack trace) formatlayıp döndürür
   * @param error Hata nesnesi
   * @returns Formatlanmı�Y hata yı�Yını
   */
  private formatDetailedStack(error: Error): string {
    if (!error || !error.stack) return 'Hata yı�Yını (stack trace) bulunamadı';

    // Stack trace detayını ayırma
    const stackLines = error.stack.split('\n');
    const formattedStack = stackLines
      .map((line, index) => {
        // İlk satır hata mesajıdır, onu farklı formatlayalım
        if (index === 0) return `\x1b[31m${line}\x1b[0m`; // Kırmızı renk

        // Uygulama kodunu içeren satırları vurgulayalım
        if (line.includes('/src/')) {
          return `\x1b[33m${line.trim()}\x1b[0m`; // Sarı renk - uygulama kodu
        }

        // Di�Yer satırlar için gri renk
        return `\x1b[90m${line.trim()}\x1b[0m`;
      })
      .join('\n');

    return formattedStack;
  }

  /**
   * Fonksiyon ça�Yrı detaylarını çıkarır
   * @param depth Kaç seviye geriye gidece�Yi
   * @returns Fonksiyon ça�Yrı bilgileri
   */
  private getCallerDetails(depth: number = 2): {
    fileName: string;
    line: number;
    column: number;
    functionName: string;
  } {
    const stack = new Error().stack;
    if (!stack)
      return {
        fileName: 'unknown',
        line: 0,
        column: 0,
        functionName: 'unknown',
      };

    const stackLines = stack.split('\n');
    // depth + 1 çünkü ilk satır 'Error' satırı ve getCallerDetails'in kendisi var
    const callerLine = stackLines[depth + 1] || '';

    // Regex ile dosya yolunu, satır ve sütun numarasını ve fonksiyon adını çıkar
    const regexResult = /at\s+(.*)\s+\((.*):(\d+):(\d+)\)/.exec(callerLine);
    const [_, functionName, fileName, line, column] = regexResult || [
      '',
      '',
      'unknown',
      '0',
      '0',
    ];

    return {
      fileName: fileName || 'unknown',
      line: parseInt(line, 10) || 0,
      column: parseInt(column, 10) || 0,
      functionName: functionName || 'unknown',
    };
  }

  /**
   * Renkli terminal log çıktısı olu�Yturur
   * @param level Log seviyesi
   * @param message Mesaj
   * @param details Ek detaylar
   * @returns Renkli terminal log çıktısı
   */
  private colorizeTerminalLog(
    level: string,
    message: string,
    details: any,
  ): string {
    // Log seviyeleri için renkler
    const colors = {
      ERROR: '\x1b[31m', // Kırmızı
      WARN: '\x1b[33m', // Sarı
      INFO: '\x1b[36m', // Açık Mavi
      DEBUG: '\x1b[90m', // Gri
      CUSTOM: '\x1b[35m', // Mor
    };

    const resetColor = '\x1b[0m';
    const levelColor = colors[level] || colors.CUSTOM;

    // Zaman damgası
    const timestamp = new Date().toISOString();

    // �+a�Yrı detayları
    const caller = this.getCallerDetails(3); // 3 seviye geriye git (error, logWithFormat, log metodları)

    // Temel log
    let logString = `${levelColor}[${timestamp}] [${level}]${resetColor} ${message}`;

    // Dosya ve satır bilgisi
    if (caller.fileName !== 'unknown') {
      const shortFileName = caller.fileName.split('/').pop() || caller.fileName;
      logString += ` ${colors.DEBUG}(${shortFileName}:${caller.line})${resetColor}`;
    }

    // Detaylar varsa ekle
    if (details && Object.keys(details).length > 0) {
      try {
        logString += `\n${colors.DEBUG}Details: ${JSON.stringify(details, null, 2)}${resetColor}`;
      } catch (e) {
        logString += `\n${colors.DEBUG}Details: [Serile�Ytirilemeyen nesne]${resetColor}`;
      }
    }

    return logString;
  }

  /**
   * Performans ölçümü ba�Ylatır ve bir izleme ID'si döndürür
   * @param label Performans ölçümü için etiket
   * @returns İzleme ID'si
   */
  public startPerformanceTracking(label: string): string {
    const trackingId = `perf_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    this.performanceMarks[trackingId] = {
      label,
      startTime: performance.now(),
      memory: process.memoryUsage(),
    };
    return trackingId;
  }

  /**
   * Performans ölçümünü sonlandırır ve sonuçları döndürür
   * @param trackingId İzleme ID'si
   * @returns Performans sonuçları
   */
  public endPerformanceTracking(trackingId: string): {
    label: string;
    durationMs: number;
    memoryDiff: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  } {
    if (!this.performanceMarks[trackingId]) {
      this.warn(
        `Performans izleme ID'si bulunamadı: ${trackingId}`,
        'LoggerService.endPerformanceTracking',
        __filename,
      );
      return {
        label: 'unknown',
        durationMs: 0,
        memoryDiff: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
      };
    }

    const mark = this.performanceMarks[trackingId];
    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const memoryDiff = {
      rss: endMemory.rss - mark.memory.rss,
      heapTotal: endMemory.heapTotal - mark.memory.heapTotal,
      heapUsed: endMemory.heapUsed - mark.memory.heapUsed,
      external: endMemory.external - mark.memory.external,
    };

    const result = {
      label: mark.label,
      durationMs: endTime - mark.startTime,
      memoryDiff,
    };

    // Performans sonuçlarını logla
    this.debug(
      `Performans ölçümü: ${mark.label} - ${result.durationMs.toFixed(2)}ms`,
      'LoggerService.endPerformanceTracking',
      __filename,
      undefined,
      {
        trackingId,
        durationMs: result.durationMs,
        memoryDiffMB: {
          rss: (memoryDiff.rss / 1024 / 1024).toFixed(2) + ' MB',
          heapTotal: (memoryDiff.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
          heapUsed: (memoryDiff.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          external: (memoryDiff.external / 1024 / 1024).toFixed(2) + ' MB',
        },
      },
    );

    // İzleme bilgisini temizle
    delete this.performanceMarks[trackingId];

    return result;
  }

  // Log seviyesine göre mesajları formatlayarak loglar
  private logWithFormat(
    level: LogLevel,
    message: string,
    source?: string,
    fileName?: string,
    line?: number,
    contextData?: any,
  ): void {
    if (this.shouldLog(level)) {
      try {
        // Temel log bilgileri
        const timestamp = new Date().toISOString();
        const formattedLevel = level.padEnd(7, ' ');
        const fileInfo = fileName
          ? ` (${fileName}${line ? `:${line}` : ''})`
          : '';
        const formattedSource = source ? `[${source}]` : '';

        // Ana log metni
        const logText = `[${timestamp}] [${formattedLevel}] ${formattedSource}${message}${fileInfo}`;

        // Terminal için renkli log
        const coloredLog = this.colorizeTerminalLog(
          level,
          `${formattedSource} ${message}`,
          contextData,
        );
        console.log(coloredLog);

        // Dosyaya yazılacak log metni (renkli de�Yil)
        let fileLogText = logText;

        // Hata objesi varsa stack trace ekle
        if (contextData?.error instanceof Error) {
          const errorStack =
            contextData.error.stack || contextData.error.toString();
          fileLogText += `\n${errorStack}`;

          // Terminal kaydına da ekleyelim
          console.log(this.formatDetailedStack(contextData.error));
        }

        // Context data varsa JSON olarak ekle (dosyaya)
        if (contextData && Object.keys(contextData).length > 0) {
          try {
            const contextString = JSON.stringify(contextData);
            fileLogText += `\nContext: ${contextString}`;
          } catch (e) {
            fileLogText += '\nContext: [Non-serializable object]';
          }
        }

        // Dosyaya yazma
        if (this.logToFile) {
          const logFileName = this.getLogFileName(level);
          if (logFileName) {
            this.appendToFile(logFileName, fileLogText);
          }
        }
      } catch (error) {
        // Logger içinde hata olu�Yursa güvenli bir �Yekilde konsola yazdır
        console.error('Logger error:', error);
      }
    }
  }

  /**
   * Belirtilen seviyedeki logların kaydedilip kaydedilmeyece�Yini kontrol eder
   * @param level Log seviyesi
   * @returns Log kaydedilmeli mi?
   */
  private shouldLog(level: LogLevel): boolean {
    // E�Yer loglama kapalıysa hiçbir �Yey loglama
    if (!this.enabled) {
      return false;
    }

    // Log seviyelerine sayısal de�Yerler ata
    const levelValues: Record<LogLevel, number> = {
      [LogLevel.ERROR]: 3,
      [LogLevel.WARN]: 2,
      [LogLevel.INFO]: 1,
      [LogLevel.DEBUG]: 0,
    };

    // Minimum log seviyesine göre kontrol et
    return levelValues[level] >= levelValues[this.minLevel];
  }

  /**
   * Log seviyesine göre log dosyası adını döndürür
   * @param level Log seviyesi
   * @returns Log dosyası adı
   */
  private getLogFileName(level: LogLevel): string | null {
    // error ve warn seviyeleri error.log'a, di�Yerleri backend.log'a
    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      return path.join(this.logDir, 'backend-error.log');
    }
    // backend.log dosya yolu (flow-tracker kayıtları için)
    const backendLogPath = path.join(this.logDir, 'backend-flow-tracker.log');
    return backendLogPath;
  }

  /**
   * Frontend logları için dosya yolunu döndürür
   */
  public getFrontendLogPath(): string {
    return path.join(this.logDir, 'frontend-flow-tracker.log');
  }

  /**
   * Frontend log dosyasını temizler
   */
  public clearFrontendLogFile(): void {
    if (this.logToFile) {
      try {
        const frontendLogPath = this.getFrontendLogPath();
        fs.writeFileSync(frontendLogPath, '', { encoding: 'utf8' });
        if (this.logToConsole) {
          console.log(`�Y�� Frontend log dosyası temizlendi: ${frontendLogPath}`);
        }
      } catch (err) {
        console.error('Frontend log dosyası temizlenirken hata olu�Ytu:', err);
      }
    }
  }

  /**
   * Frontend logunu dosyaya yazar
   * @param logEntry Frontend'den gelen log girdisi
   */
  public logFrontendEntry(formattedLog: string): void {
    if (!this.logToFile) return;

    try {
      const frontendLogPath = this.getFrontendLogPath();
      fs.appendFileSync(frontendLogPath, formattedLog + '\n', {
        encoding: 'utf8',
      });
    } catch (err) {
      console.error('Frontend log yazılırken hata olu�Ytu:', err);
    }
  }

  /**
   * Log dosyasına veri ekler
   * @param fileName Dosya adı
   * @param content Eklenecek içerik
   */
  private appendToFile(fileName: string, content: string): void {
    try {
      // Dosyaya asenkron olarak ekle
      fs.appendFile(fileName, content + '\n', { encoding: 'utf8' }, (err) => {
        if (err) {
          // Konsola yazdırma kaldırıldı
          // console.error(`Log dosyasına yazılırken hata: ${err.message}`);
        }
        // Konsola yazdırma kaldırıldı
        // else {
        //   console.log(`[Logger] Log dosyasına yazıldı: ${fileName}`);
        // }
      });
    } catch (error) {
      // Konsola yazdırma kaldırıldı
      // console.error(`Log dosyasına yazma hatası: ${(error as Error).message}`);
    }
  }

  /**
   * Sınav olu�Yturma süreciyle ilgili log kaydeder
   * @param message Log mesajı
   * @param context Ek ba�Ylam bilgileri (opsiyonel)
   * @param level Log seviyesi (default: 'info')
   */
  logExamProcess(
    message: string,
    context?: any,
    level: 'info' | 'debug' | 'warn' | 'error' = 'info',
  ) {
    // Timestamp ekleyerek daha zengin bir log olu�Ytur
    const logPrefix = `[${new Date().toISOString()}]`;

    // Log metni
    let logText = `${logPrefix} ${message}`;

    // Context bilgisi varsa ekle
    if (context) {
      // Object ya da array'i formatlı göster
      const contextStr =
        typeof context === 'object'
          ? JSON.stringify(context, null, 2)
          : context.toString();

      logText += `\nContext: ${contextStr}`;
    }

    // Log seviyesine göre kaydet
    switch (level) {
      case 'debug':
        this.examProcessLogger.debug(logText);
        break;
      case 'warn':
        this.examProcessLogger.warn(logText);
        break;
      case 'error':
        this.examProcessLogger.error(logText);
        break;
      default:
        this.examProcessLogger.info(logText);
    }

    // Kritik loglar için ayrıca normal log sistemine de kaydet
    if (level === 'error' || level === 'warn') {
      this[level](
        `SINAV S�oRECI: ${message}`,
        'ExamProcessLogger',
        __filename,
        undefined,
        context,
      );
    }
  }

  /**
   * Sınav olu�Yturma sürecinin ba�Ylangıcını loglar
   * @param userId Kullanıcı ID'si
   * @param quizType Sınav türü
   * @param metadata Sınav meta bilgileri
   */
  logExamStart(
    userId: string,
    quizType: string,
    metadata: Record<string, any> = {},
  ) {
    this.logExamProcess(
      `[BA�?LANGI�+] ${userId} ID'li kullanıcı için ${quizType} türünde sınav olu�Yturma süreci ba�Ylatıldı`,
      { ...metadata, userId, quizType, timestamp: new Date().toISOString() },
    );
  }

  /**
   * Sınav olu�Yturma sürecinin biti�Yini loglar
   * @param userId Kullanıcı ID'si
   * @param quizId Olu�Yturulan sınav ID'si
   * @param metadata Sınav meta bilgileri
   */
  logExamCompletion(
    userId: string,
    quizId: string,
    metadata: Record<string, any> = {},
  ) {
    const duration = metadata.startTime
      ? `${Math.round((Date.now() - metadata.startTime) / 1000)} saniye`
      : 'bilinmiyor';

    this.logExamProcess(
      `[TAMAMLANDI] ${userId} ID'li kullanıcı için ${quizId} ID'li sınav olu�Yturuldu. Süreç ${duration} sürdü.`,
      { ...metadata, userId, quizId, completedAt: new Date().toISOString() },
    );
  }

  /**
   * Sınav olu�Yturma sürecinde bir a�Yamayı loglar
   * @param userId Kullanıcı ID'si
   * @param step A�Yama adı
   * @param metadata A�Yama meta bilgileri
   */
  logExamStage(
    userId: string,
    step: string,
    metadata: Record<string, any> = {},
  ) {
    this.logExamProcess(`[A�?AMA] ${userId} ID'li kullanıcı: ${step}`, {
      ...metadata,
      userId,
      step,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Sınav olu�Yturma sürecinde bir hata loglar
   * @param userId Kullanıcı ID'si
   * @param error Hata
   * @param context Hata ba�Ylamı
   */
  logExamError(
    userId: string,
    error: Error | string,
    context: Record<string, any> = {},
  ) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logExamProcess(
      `[HATA] ${userId} ID'li kullanıcı: ${errorMessage}`,
      {
        ...context,
        userId,
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      },
      'error',
    );
  }
}

