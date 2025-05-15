/**
 * @file logger.utils.ts
 * @description Frontend loglama yardımcı fonksiyonları
 */

import { LoggerService } from '../services/logger.service';
import { FlowTrackerService, FlowCategory as TrackerFlowCategory } from '../services/flow-tracker.service';
import { FlowCategory } from "@/constants/logging.constants";

let loggerInstance: LoggerService | null = null;
let flowTrackerInstance: FlowTrackerService | null = null;

// Flow kategorileri tipi - LoggerService ve FlowTracker için
// export enum FlowCategory {
//   API = 'API',                // API çağrıları
//   Auth = 'Auth',              // Kimlik doğrulama işlemleri
//   UI = 'UI',                  // Kullanıcı arayüzü
//   Error = 'Error',            // Hata izleme
//   Custom = 'Custom',          // Özel kategoriler
//   Firebase = 'Firebase',      // Firebase işlemleri
//   Navigation = 'Navigation',  // Gezinti işlemleri
//   Component = 'Component',    // Bileşen işlemleri
//   State = 'State',            // Durum değişiklikleri
//   Render = 'Render',          // Render işlemleri
//   User = 'User'               // Kullanıcı işlemleri
// }

// FlowCategory'yi TrackerFlowCategory'ye eşleştiren yardımcı fonksiyon
export function mapToTrackerCategory(category: FlowCategory): TrackerFlowCategory {
  switch(category) {
    case FlowCategory.API:
      return TrackerFlowCategory.API;
    case FlowCategory.Auth:
      return TrackerFlowCategory.Auth;
    case FlowCategory.Error:
      return TrackerFlowCategory.Error;
    case FlowCategory.Navigation:
      return TrackerFlowCategory.Navigation;
    case FlowCategory.Component:
      return TrackerFlowCategory.Component;
    case FlowCategory.State:
      return TrackerFlowCategory.State;
    case FlowCategory.Render:
      return TrackerFlowCategory.Render;
    case FlowCategory.User:
      return TrackerFlowCategory.User;
    case FlowCategory.Business:
      return TrackerFlowCategory.Custom;
    case FlowCategory.Custom:
    default:
      return TrackerFlowCategory.Custom;
  }
}

/**
 * Dosya adını yoldan çıkarır
 * @param filePath Dosya yolu
 * @returns Dosya adı
 */
export function extractFileName(filePath: string): string {
  if (!filePath) return 'unknown';
  const parts = filePath.split(/[\/\\]/);
  return parts[parts.length - 1];
}

/**
 * Logger servisini kurar
 * @param options Logger servisi opsiyonları
 * @returns LoggerService instance
 */
export function setupLogger(options?: Parameters<typeof LoggerService.getInstance>[0]): LoggerService {
  loggerInstance = LoggerService.getInstance({
    ...options,
    enableFileLogging: true // Tüm hata loglarını dosyaya yazma özelliğini etkinleştir
  });
  return loggerInstance;
}

/**
 * FlowTracker servisini kurar
 * @param options FlowTracker servisi opsiyonları
 * @returns FlowTrackerService instance
 */
export function setupFlowTracker(options?: Parameters<typeof FlowTrackerService.getInstance>[0]): FlowTrackerService {
  flowTrackerInstance = FlowTrackerService.getInstance({
    ...options,
    logger: loggerInstance || undefined
  });
  return flowTrackerInstance;
}

/**
 * Logger ve FlowTracker servislerini yükler
 * @returns Logger ve FlowTracker instanları
 */
export function setupLogging(options?: {
  loggerOptions?: Parameters<typeof LoggerService.getInstance>[0];
  flowTrackerOptions?: Parameters<typeof FlowTrackerService.getInstance>[0];
}) {
  // Sırayla LoggerService ve FlowTrackerService'i başlat
  const logger = setupLogger(options?.loggerOptions);
  const flowTracker = setupFlowTracker({
    ...(options?.flowTrackerOptions || {}),
    logger: logger  // Logger'ı FlowTracker'a bağla
  });
  
  return { logger, flowTracker };
}

/**
 * Logger instance alır, yoksa oluşturur
 * @returns LoggerService instance
 */
export function getLogger(): LoggerService {
  if (!loggerInstance) {
    loggerInstance = LoggerService.getInstance({
      enableFileLogging: true, // Dosya loglamayı varsayılan olarak etkinleştir
      logFilePath: 'frontend-logs.log'
    });
  }
  return loggerInstance;
}

/**
 * FlowTracker instance alır, yoksa oluşturur
 * @returns FlowTrackerService instance
 */
export function getFlowTracker(): FlowTrackerService {
  if (!flowTrackerInstance) {
    flowTrackerInstance = FlowTrackerService.getInstance();
  }
  return flowTrackerInstance;
}

/**
 * Hata kaydı yapar
 * @param error Hata nesnesi
 * @param context İşlem yapılan bağlam
 * @param metadata Ek bilgiler
 */
export function logError(error: Error | string, context: string, metadata?: Record<string, unknown>): void {
  if (!loggerInstance) {
    console.error('Logger servisi başlatılmamış! Hata:', error);
    return;
  }
  
  loggerInstance.logError(error, context, metadata);
}

/**
 * Bilgi kaydı yapar
 * @param message Log mesajı
 * @param context İşlem yapılan bağlam
 * @param filePath Dosya yolu
 * @param lineNumber Satır numarası
 * @param metadata Ek bilgiler
 */
export function logInfo(
  message: string,
  context: string,
  filePath?: string,
  lineNumber?: number,
  metadata?: Record<string, unknown>
): void {
  if (!loggerInstance) {
    console.info(`[INFO] [${context}] ${message}`);
    return;
  }
  
  loggerInstance.info(message, context, filePath, lineNumber, metadata);
}

/**
 * Uyarı kaydı yapar
 * @param message Log mesajı
 * @param context İşlem yapılan bağlam
 * @param filePath Dosya yolu
 * @param lineNumber Satır numarası
 * @param metadata Ek bilgiler
 */
export function logWarn(
  message: string,
  context: string,
  filePath?: string,
  lineNumber?: number,
  metadata?: Record<string, unknown>
): void {
  if (!loggerInstance) {
    console.warn(`[WARN] [${context}] ${message}`);
    return;
  }
  
  loggerInstance.warn(message, context, filePath, lineNumber, metadata);
}

/**
 * Debug kaydı yapar
 * @param message Log mesajı
 * @param context İşlem yapılan bağlam
 * @param filePath Dosya yolu
 * @param lineNumber Satır numarası
 * @param metadata Ek bilgiler
 */
export function logDebug(
  message: string,
  context: string,
  filePath?: string,
  lineNumber?: number,
  metadata?: Record<string, unknown>
): void {
  if (!loggerInstance) {
    console.debug(`[DEBUG] [${context}] ${message}`);
    return;
  }
  
  loggerInstance.debug(message, context, filePath, lineNumber, metadata);
}

/**
 * Akış adımı izler
 * @param message Akış mesajı
 * @param context İşlem yapılan bağlam
 * @param category Akış kategorisi
 * @param metadata Ek bilgiler
 */
export function trackFlow(
  message: string,
  context: string,
  category: FlowCategory = FlowCategory.Custom,
  metadata?: Record<string, unknown>
): void {
  if (!flowTrackerInstance) {
    console.log(`[FLOW] [${category}] [${context}] ${message}`);
    return;
  }
  
  const trackerCategory = mapToTrackerCategory(category);
  flowTrackerInstance.trackStep(trackerCategory, message, context, metadata);
}

/**
 * Log dosyasının içeriğini getirir
 * @returns Log dosyası içeriği
 */
export function getLogFileContent(): string {
  if (!loggerInstance) {
    return '';
  }
  
  return loggerInstance.getLogFileContent();
}

/**
 * Log dosyasını temizler
 */
export function clearLogFile(): void {
  if (!loggerInstance) {
    return;
  }
  
  loggerInstance.clearLogFile();
}

/**
 * Log dosyasını indir
 * @param fileName İndirilen dosya adı
 */
export function downloadLogFile(fileName: string = 'app-logs.log'): void {
  if (!loggerInstance) {
    return;
  }
  
  const logContent = getLogFileContent();
  if (!logContent || typeof window === 'undefined') {
    return;
  }
  
  try {
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logInfo('Log dosyası indirildi', 'logger.utils.downloadLogFile', __filename);
  } catch (error) {
    logError(error instanceof Error ? error : String(error), 'logger.utils.downloadLogFile');
  }
}

// React bileşenleri için yardımcı işlevler

/**
 * Bileşen yaşam döngüsü izleme
 * @param componentName Bileşen adı
 * @param lifecycle Yaşam döngüsü aşaması
 * @param props Bileşen props'ları
 */
export function trackComponent(
  componentName: string,
  lifecycle: 'mount' | 'update' | 'unmount',
  props?: Record<string, unknown>
): void {
  if (!flowTrackerInstance) {
    console.log(`[COMPONENT] ${componentName} - ${lifecycle}`);
    return;
  }
  
  flowTrackerInstance.trackComponent(componentName, lifecycle, props);
}

/**
 * Durum değişikliği izleme
 * @param stateName Durum adı
 * @param context İşlem yapılan bağlam
 * @param oldValue Eski değer
 * @param newValue Yeni değer
 */
export function trackStateChange(
  stateName: string,
  context: string,
  oldValue: unknown,
  newValue: unknown
): void {
  if (!flowTrackerInstance) {
    console.log(`[STATE] ${context} - ${stateName} durumu değişti`);
    return;
  }
  
  flowTrackerInstance.trackStateChange(stateName, context, oldValue, newValue);
}

/**
 * API çağrısı izleme
 * @param endpoint API endpoint
 * @param method HTTP metodu
 * @param context İşlem yapılan bağlam
 * @param metadata Ek bilgiler
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  context: string,
  metadata?: Record<string, unknown>
): void {
  if (!flowTrackerInstance) {
    console.log(`[API] ${context} - ${method} ${endpoint}`);
    return;
  }
  
  flowTrackerInstance.trackApiCall(endpoint, method, context, metadata);
}

/**
 * Performans ölçümüne başlar
 * @param name Ölçüm adı
 */
export function markStart(name: string): void {
  if (!flowTrackerInstance) {
    console.time(name);
    return;
  }
  
  flowTrackerInstance.markStart(name);
}

/**
 * Performans ölçümünü bitirir ve süreyi döndürür
 * @param name Ölçüm adı
 * @param category Kategori
 * @param context İşlem yapılan bağlam
 * @returns Geçen süre (ms)
 */
export function markEnd(
  name: string,
  category: FlowCategory = FlowCategory.Custom,
  context: string
): number {
  if (!flowTrackerInstance) {
    console.timeEnd(name);
    return 0;
  }
  
  const trackerCategory = mapToTrackerCategory(category);
  return flowTrackerInstance.markEnd(name, trackerCategory, context);
}

/**
 * Async fonksiyonun çalışma süresini ölçer
 * @param name Ölçüm adı
 * @param category Kategori
 * @param context İşlem yapılan bağlam
 * @param fn Ölçülecek async fonksiyon
 * @returns Fonksiyonun dönüş değeri
 */
export async function measureAsync<T>(
  name: string,
  category: FlowCategory = FlowCategory.Custom,
  context: string,
  fn: () => Promise<T>
): Promise<T> {
  if (!flowTrackerInstance) {
    console.time(name);
    try {
      const result = await fn();
      return result;
    } finally {
      console.timeEnd(name);
    }
  }
  
  const trackerCategory = mapToTrackerCategory(category);
  return flowTrackerInstance.measureAsync(name, trackerCategory, context, fn);
}

/**
 * Senkron fonksiyonun çalışma süresini ölçer
 * @param name Ölçüm adı
 * @param category Kategori
 * @param context İşlem yapılan bağlam
 * @param fn Ölçülecek fonksiyon
 * @returns Fonksiyonun dönüş değeri
 */
export function measure<T>(
  name: string,
  category: FlowCategory = FlowCategory.Custom,
  context: string,
  fn: () => T
): T {
  if (!flowTrackerInstance) {
    console.time(name);
    try {
      const result = fn();
      return result;
    } finally {
      console.timeEnd(name);
    }
  }
  
  const trackerCategory = mapToTrackerCategory(category);
  return flowTrackerInstance.measure(name, trackerCategory, context, fn);
}

/**
 * Flow akış izleyici sınıfı
 */
export class FlowTracker {
  constructor(
    private readonly id: string,
    private readonly category: TrackerFlowCategory,
    private readonly name: string
  ) {}

  /**
   * Akış adımı kaydeder
   * @param step Adım açıklaması
   * @param metadata Ek bilgiler
   * @returns FlowTracker instance (zincir için)
   */
  trackStep(step: string, metadata?: Record<string, unknown>): FlowTracker {
    trackFlow(
      step,
      `Flow:${this.name}`,
      this.category,
      {
        flowId: this.id,
        flowName: this.name,
        ...metadata
      }
    );
    return this;
  }

  /**
   * Akışı sonlandırır
   * @param summary Özet mesaj
   */
  end(summary?: string): void {
    trackFlow(
      summary || `Flow tamamlandı: ${this.name}`,
      `Flow:${this.name}`,
      this.category,
      {
        flowId: this.id,
        flowName: this.name,
        status: 'completed'
      }
    );
  }
}

/**
 * Yeni bir akış başlatır
 * @param category Akış kategorisi
 * @param name Akış adı
 * @returns FlowTracker instance
 */
export function startFlow(category: FlowCategory, name: string): FlowTracker {
  if (!flowTrackerInstance) {
    console.warn("FlowTrackerService başlatılmamış, dummy FlowTracker kullanılıyor.");
    return new FlowTracker("dummy-id", mapToTrackerCategory(category), name);
  }
  return flowTrackerInstance.startFlow(mapToTrackerCategory(category), name);
} 

/**
 * Gelişmiş hata izleme ve konsolda gösterme
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Hata yığınını (stack trace) işler ve önemli parçaları vurgular
 * @param errorStack Hata yığını metni
 * @returns Formatlanmış hata yığını
 */
export function formatErrorStack(errorStack: string): string[] {
  if (!errorStack) return ['Hata yığını (stack trace) bulunamadı'];
  
  // Stack trace'i satırlara ayır
  const stackLines = errorStack.split('\n');
  
  // Stack trace satırlarını işle
  return stackLines.map((line, index) => {
    // İlk satır hata mesajıdır
    if (index === 0) {
      return `%c${line}%c`; // Kırmızı renk
    }
    
    // Uygulama kodunu içeren satırları vurgula
    if (line.includes('/src/') || line.includes('/app/') || line.includes('/components/')) {
      // Uygulama kodu - sarı renkli ve kalın
      return `%c${line.trim()}%c`;
    }
    
    // Diğer satırlar
    return `%c${line.trim()}%c`;
  });
}

/**
 * Konsolda renkli hata gösterimi
 * @param error Yakalanan hata
 * @param info Ek bağlam bilgisi
 */
export function prettyErrorLog(error: Error, info?: Record<string, any>): void {
  if (!error) return;
  
  const errorName = error.name || 'Error';
  const errorMessage = error.message || 'Bilinmeyen hata';
  const errorStack = error.stack || '';
  
  // Hata başlığı ve mesajı
  console.group(`%c🚨 ${errorName}: ${errorMessage}`, 'color: #e74c3c; font-weight: bold; font-size: 1.2em;');
  
  // Zaman damgası
  console.log(`%c⏱️ Zaman: ${new Date().toISOString()}`, 'color: #7f8c8d');
  
  // URL ve bileşen bilgisi
  console.log(`%c🔗 URL: ${window.location.href}`, 'color: #3498db');
  
  // Bağlam bilgisi varsa göster
  if (info && Object.keys(info).length > 0) {
    console.log('%c📋 Bağlam:', 'color: #f39c12; font-weight: bold;');
    console.table(info);
  }
  
  // Hata yığınını formatla ve göster
  console.log('%c📚 Hata Yığını:', 'color: #9b59b6; font-weight: bold;');
  
  const formattedStackLines = formatErrorStack(errorStack);
  
  // Renkli gösterim için stil dizilerini oluştur
  const styles = formattedStackLines.flatMap(() => [
    'color: #e74c3c; font-weight: bold;', // Hata satırı stili
    'color: #7f8c8d; font-weight: normal;' // Normal satır stili
  ]);
  
  // Renkli log
  console.log(formattedStackLines.join('\n'), ...styles);
  
  console.groupEnd();
}

/**
 * Global hata yakalama mekanizması
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    const originalWindowOnerror = window.onerror;
    const originalUnhandledRejection = window.onunhandledrejection;
    
    // console.error override
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // İlk argüman bir Error nesnesi mi kontrol et
      if (args[0] instanceof Error) {
        prettyErrorLog(args[0], { source: 'console.error', args: args.slice(1) });
      }
    };
    
    // window.onerror override
    window.onerror = (message, source, lineno, colno, error) => {
      if (originalWindowOnerror) {
        originalWindowOnerror.apply(window, [message, source, lineno, colno, error]);
      }
      
      if (error) {
        prettyErrorLog(error, { 
          source: 'window.onerror', 
          location: `${source}:${lineno}:${colno}`, 
          message 
        });
      }
      
      return false; // Hata işlemesinin varsayılan davranışa devam etmesine izin ver
    };
    
    // Unhandled promise rejection override
    window.onunhandledrejection = (event) => {
      if (originalUnhandledRejection) {
        originalUnhandledRejection.apply(window, [event]);
      }
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason || 'Unhandled Promise Rejection'));
      
      prettyErrorLog(error, { source: 'unhandledrejection', reason: event.reason });
    };
    
    console.log('%c🛡️ Global hata izleme aktif edildi', 'color: #2ecc71; font-weight: bold');
  }
}

// Geliştirme ortamında otomatik olarak kur
if (isDevelopment && typeof window !== 'undefined') {
  setupGlobalErrorHandling();
}

/**
 * Hata bilgisini günlüğe kaydetme ve gösterme
 * @param error Yakalanan hata
 * @param componentName Hatanın oluştuğu bileşen
 * @param extraData Ekstra veri
 */
export function prettyLogError(error: unknown, componentName: string, extraData?: Record<string, any>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  
  const logInfo = {
    component: componentName,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...extraData
  };
  
  // Geliştirilmiş hata gösterimi 
  prettyErrorLog(err, logInfo);
  
  // Üretim ortamında hata izleme servisine gönder
  if (!isDevelopment) {
    // Burada bir hata izleme servisine gönderme kodu eklenebilir (Sentry, LogRocket, vb.)
    try {
      // TODO: Hata izleme servisi entegrasyonu eklenebilir
      // sendToErrorTrackingService(err, logInfo);
    } catch (trackingError) {
      console.error('Hata izleme servisi hatası:', trackingError);
    }
  }
} 