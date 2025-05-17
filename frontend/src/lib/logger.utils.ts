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
    ...options
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
    loggerInstance = LoggerService.getInstance();
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
  
  if (typeof error === 'string') {
    loggerInstance.error(error, context, undefined, undefined, metadata);
  } else {
    loggerInstance.error(error.message, context, error, error.stack, metadata);
  }
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
  
  loggerInstance.info(message, context, undefined, undefined, metadata);
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
  
  loggerInstance.warn(message, context, undefined, undefined, metadata);
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
  
  loggerInstance.debug(message, context, undefined, undefined, metadata);
}

/**
 * Akış kaydı yapar
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
  
  flowTrackerInstance.trackStep(mapToTrackerCategory(category), message, context, metadata);
}

/**
 * Log dosyası içeriğini alır
 * @returns Log dosyası içeriği
 */
export function getLogFileContent(): string {
  if (!loggerInstance) {
    return '';
  }
  
  return loggerInstance.getAllErrorLogs();
}

/**
 * Log dosyasını temizler
 */
export function clearLogFile(): void {
  if (!loggerInstance) {
    return;
  }
  
  loggerInstance.clearAllLogs();
}

/**
 * Log dosyasını indirir
 */
export function downloadLogFile(): void {
  try {
    const logs = getLogFileContent();
    if (!logs) {
      console.warn('İndirilebilecek log bulunamadı.');
      return;
    }
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `frontend-log-${new Date().toISOString().replace(/:/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    
    // Kaynakları temizle
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Log dosyası indirme hatası:', error);
  }
}

/**
 * Bileşen yaşam döngüsü olayını izler
 * @param componentName Bileşen adı
 * @param lifecycle Yaşam döngüsü olayı
 * @param props Bileşen props'ları
 */
export function trackComponent(
  componentName: string,
  lifecycle: 'mount' | 'update' | 'unmount',
  props?: Record<string, unknown>
): void {
  if (!flowTrackerInstance) {
    console.log(`[COMPONENT] [${componentName}] ${lifecycle}`);
    return;
  }
  
  flowTrackerInstance.trackComponent(componentName, lifecycle, props);
}

/**
 * Durum değişikliğini izler
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
    console.log(`[STATE] [${context}] ${stateName} değişti`);
    return;
  }
  
  flowTrackerInstance.trackStateChange(stateName, context, oldValue, newValue);
}

/**
 * API çağrısını izler
 * @param endpoint Endpoint URL'i
 * @param method HTTP metodu (GET, POST, vs.)
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
    console.log(`[API] [${context}] ${method} ${endpoint}`);
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
 * Performans ölçümünü bitirir ve süreyi kaydeder
 * @param name Ölçüm adı
 * @param category Akış kategorisi
 * @param context İşlem yapılan bağlam
 * @returns Ölçüm süresi (ms)
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
  
  return flowTrackerInstance.markEnd(name, mapToTrackerCategory(category), context);
}

/**
 * Asenkron işlemi izler
 * @param name İşlem adı
 * @param category Akış kategorisi
 * @param context İşlem yapılan bağlam
 * @param fn Asenkron işlev
 * @returns İşlem sonucu
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
      console.timeEnd(name);
      return result;
    } catch (error) {
      console.timeEnd(name);
      throw error;
    }
  }
  
  return flowTrackerInstance.measureAsync(
    name,
    mapToTrackerCategory(category),
    context,
    fn
  );
}

/**
 * Senkron işlemi izler
 * @param name İşlem adı
 * @param category Akış kategorisi
 * @param context İşlem yapılan bağlam
 * @param fn Senkron işlev
 * @returns İşlem sonucu
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
      console.timeEnd(name);
      return result;
    } catch (error) {
      console.timeEnd(name);
      throw error;
    }
  }
  
  return flowTrackerInstance.measure(
    name,
    mapToTrackerCategory(category),
    context,
    fn
  );
}

/**
 * Akış izleme sınıfı
 */
export class FlowTracker {
  private readonly id: string;
  private readonly category: FlowCategory;
  private readonly name: string;
  
  constructor(
    id: string,
    category: FlowCategory,
    name: string
  ) {
    this.id = id;
    this.category = category;
    this.name = name;
  }
  
  /**
   * Akış adımı ekler
   * @param step Adım adı
   * @param metadata Ek bilgiler
   * @returns FlowTracker instance
   */
  trackStep(step: string, metadata?: Record<string, unknown>): FlowTracker {
    if (flowTrackerInstance) {
      flowTrackerInstance.trackStep(
        mapToTrackerCategory(this.category),
        step,
        `Flow:${this.name}`,
        {
          flowId: this.id,
          flowName: this.name,
          ...metadata
        }
      );
    } else {
      console.log(`[FLOW] [${this.category}] [Flow:${this.name}] ${step}`);
    }
    
    return this;
  }
  
  /**
   * Akışı sonlandırır
   * @param summary Özet bilgi
   */
  end(summary?: string): void {
    if (flowTrackerInstance) {
      flowTrackerInstance.trackStep(
        mapToTrackerCategory(this.category),
        summary || `Flow tamamlandı: ${this.name}`,
        `Flow:${this.name}`,
        {
          flowId: this.id,
          flowName: this.name,
          status: 'completed'
        }
      );
    } else {
      console.log(`[FLOW] [${this.category}] [Flow:${this.name}] ${summary || `Flow tamamlandı: ${this.name}`}`);
    }
  }
}

/**
 * Yeni bir akış başlatır
 * @param category Akış kategorisi
 * @param name Akış adı
 * @returns FlowTracker instance
 */
export function startFlow(category: FlowCategory, name: string): FlowTracker {
  if (flowTrackerInstance) {
    const flowTracker = flowTrackerInstance.startFlow(mapToTrackerCategory(category), name);
    // Flow ID'yi FlowTracker nesnesinden alın
    const flowId = typeof flowTracker === 'string' ? flowTracker : 
                  (flowTracker as any)?.id || `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new FlowTracker(flowId, category, name);
  } else {
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[FLOW] [${category}] [Flow:${name}] Flow başlatıldı: ${name}`);
    return new FlowTracker(flowId, category, name);
  }
}

/**
 * Hata stack'ini formatlar
 * @param errorStack Hata stack'i
 * @returns Formatlanmış stack dizisi
 */
export function formatErrorStack(errorStack: string): string[] {
  if (!errorStack) return [];
  
  const lines = errorStack.split('\n').filter(line => line.trim() !== '');
  
  // İlk satırı (hata mesajı) ayır
  const result: string[] = [];
  if (lines.length > 0) {
    result.push(lines[0]);
  }
  
  // Stack satırlarını formatla
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('at ')) {
      result.push(line);
    }
  }
  
  return result;
}

/**
 * Hata loglarını güzelleştirilmiş şekilde yazdırır
 * @param error Hata nesnesi
 * @param info Hata bilgileri
 */
export function prettyErrorLog(error: Error, info?: Record<string, unknown>): void {
  console.group('%cHata Yakalandı', 'color: red; font-weight: bold;');
  console.error('Hata:', error.message);
  
  if (error.stack) {
    console.groupCollapsed('Stack Trace');
    formatErrorStack(error.stack).forEach(line => {
      if (line.includes('node_modules')) {
        console.log('%c' + line, 'color: gray');
      } else {
        console.log('%c' + line, 'color: crimson');
      }
    });
    console.groupEnd();
  }
  
  if (info) {
    console.groupCollapsed('Ek Bilgiler');
    console.table(info);
    console.groupEnd();
  }
  
  console.groupEnd();
  
  // Logger servisine de kaydet
  if (loggerInstance) {
    const context = info?.componentName ? String(info.componentName) : 
                   info?.context ? String(info.context) : 'ErrorHandler';
                   
    loggerInstance.error(error.message, context, error);
  }
}

/**
 * Global hata yakalama kurulumu
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') {
    return; // SSR'da çalışmaz
  }
  
  // Yakalanmamış Promise hataları
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Eğer ağ hatası ise, muhtemelen fetch hatası
    const isNetworkError = error?.name === 'TypeError' && 
                         (error?.message?.includes('fetch') || 
                          error?.message?.includes('network') ||
                          error?.message?.includes('Network'));
    
    if (isNetworkError) {
      // Ağ hatası olarak logla
      logError('Fetch hatası: ' + error.message, 'ErrorService.network', {
        type: 'network',
        timestamp: new Date().toISOString()
      });
    } else {
      // Genel hata olarak logla
      const errorMessage = error?.message || 'Bilinmeyen Promise hatası';
      logError(errorMessage, 'ErrorService.captureError.promise', {
        type: 'promise',
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
    }
    
    console.warn('Yakalanmamış Promise Hatası:', error);
  });
  
  // Yakalanmamış hataları yakala
  window.addEventListener('error', (event) => {
    // Kaynak (script, css) yükleme hatalarını filtrele
    if (event.target && (event.target as HTMLElement).tagName) {
      const tagName = (event.target as HTMLElement).tagName.toLowerCase();
      if (tagName === 'link' || tagName === 'script' || tagName === 'img') {
        logError(`${tagName} kaynağı yüklenemedi: ${(event.target as HTMLElement).getAttribute('src') || (event.target as HTMLElement).getAttribute('href')}`, 
          'ErrorService.resource', {
            type: 'resource',
            tagName,
            timestamp: new Date().toISOString()
          });
        return;
      }
    }
    
    // Genel hata olarak logla
    if (event.error) {
      const errorMessage = event.error?.message || event.message || 'Bilinmeyen hata';
      logError(errorMessage, 'ErrorService.captureError.runtime', {
        type: 'runtime',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  console.info('[ErrorHandler] Global hata yakalama aktif.');
}

/**
 * Komponent hatalarını loglar
 * @param error Hata
 * @param componentName Bileşen adı
 * @param extraData Ek veri
 */
export function prettyLogError(error: unknown, componentName: string, extraData?: Record<string, unknown>): void {
  // Hatayı tanımla
  let errorObj: Error;
  let errorMessage: string;
  
  if (error instanceof Error) {
    errorObj = error;
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorObj = new Error(error);
  } else {
    errorMessage = 'Bilinmeyen hata: ' + String(error);
    errorObj = new Error(errorMessage);
  }
  
  // Logla
  logError(errorObj, `${componentName}.error`, {
    ...extraData,
    componentName
  });
  
  // Konsola yazdır
  prettyErrorLog(errorObj, {
    componentName,
    ...extraData
  });
} 