/**
 * @file application-monitor.service.ts
 * @description Uygulama durumunu izleyen servis
 */

import { getLogger, getFlowTracker } from '@/lib/logger.utils';
import { FlowCategory } from './flow-tracker.service'; // FlowCategory tipini doğrudan servisinden import ediyoruz

// Logger ve flowTracker nesnelerini elde et
const logger = getLogger();
const flowTracker = getFlowTracker();

interface ApplicationHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastChecked: Date;
  checks: {
    memory: {
      status: 'ok' | 'warning' | 'error'; 
      details?: string;
    };
    api: {
      status: 'ok' | 'warning' | 'error';
      latency: number;
      failures: number;
      details?: string;
    };
    errors: {
      status: 'ok' | 'warning' | 'error';
      count: number;
      details?: string;
    };
    frontend: {
      status: 'ok' | 'warning' | 'error';
      renderTimes: number;
      details?: string;
    };
  };
}

interface PerformanceMetrics {
  fps: number;
  memory: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
  apiLatency: number[];
  renderTimes: Record<string, number[]>;
  longTasks: number;
  resourceLoads: {
    js: number;
    css: number;
    image: number;
    other: number;
  };
}

interface ApplicationMonitorOptions {
  sampleInterval?: number; // Milisaniye cinsinden örnekleme aralığı
  errorThreshold?: number; // Hata eşiği
  apiLatencyThreshold?: number; // API gecikme eşiği (ms)
  longTaskThreshold?: number; // Uzun görev eşiği (ms)
  maxHistorySize?: number; // Maksimum geçmiş boyutu
  enablePerformanceMonitoring?: boolean; // Performans izleme etkin mi?
  enableMemoryMonitoring?: boolean; // Bellek izleme etkin mi?
  enableApiMonitoring?: boolean; // API izleme etkin mi?
  enableErrorMonitoring?: boolean; // Hata izleme etkin mi?
}

// Performance API tiplerini tanımla
interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: MemoryInfo;
}

/**
 * Uygulama Durumu İzleme Servisi
 * 
 * Uygulama performansı, hata oranları, bellek kullanımı ve 
 * API çağrıları gibi metrikleri izler ve raporlar
 */
export class ApplicationMonitorService {
  private static instance: ApplicationMonitorService;
  private health: ApplicationHealth;
  private metrics: PerformanceMetrics;
  private apiCalls: Record<string, { times: number[], errors: number }> = {};
  private longTasks: number[] = [];
  private renderTimeHistory: Record<string, number[]> = {};
  private errorHistory: Error[] = [];
  private sampleInterval: number;
  private errorThreshold: number;
  private apiLatencyThreshold: number;
  private longTaskThreshold: number;
  private maxHistorySize: number;
  private monitoringIntervalId?: NodeJS.Timeout;
  private enablePerformanceMonitoring: boolean;
  private enableMemoryMonitoring: boolean;
  private enableApiMonitoring: boolean;
  private enableErrorMonitoring: boolean;
  
  private constructor(options: ApplicationMonitorOptions = {}) {
    // Varsayılan değerler
    this.sampleInterval = options.sampleInterval || 30000; // 30 saniye
    this.errorThreshold = options.errorThreshold || 5; // 5 hata
    this.apiLatencyThreshold = options.apiLatencyThreshold || 1000; // 1 saniye
    this.longTaskThreshold = options.longTaskThreshold || 50; // 50 ms
    this.maxHistorySize = options.maxHistorySize || 100; // 100 kayıt
    this.enablePerformanceMonitoring = options.enablePerformanceMonitoring ?? true;
    this.enableMemoryMonitoring = options.enableMemoryMonitoring ?? true;
    this.enableApiMonitoring = options.enableApiMonitoring ?? true;
    this.enableErrorMonitoring = options.enableErrorMonitoring ?? true;
    
    // Başlangıç sağlık durumu
    this.health = {
      status: 'healthy',
      lastChecked: new Date(),
      checks: {
        memory: {
          status: 'ok'
        },
        api: {
          status: 'ok',
          latency: 0,
          failures: 0
        },
        errors: {
          status: 'ok',
          count: 0
        },
        frontend: {
          status: 'ok',
          renderTimes: 0
        }
      }
    };
    
    // Başlangıç metrikleri
    this.metrics = {
      fps: 0,
      memory: {},
      apiLatency: [],
      renderTimes: {},
      longTasks: 0,
      resourceLoads: {
        js: 0,
        css: 0,
        image: 0,
        other: 0
      }
    };
    
    // Tarayıcı ortamında ise izleme başlat
    if (typeof window !== 'undefined') {
      this.setupPerformanceObserver();
      this.setupErrorHandlers();
      
      logger.info(
        'ApplicationMonitorService başlatıldı',
        'ApplicationMonitorService.constructor',
        __filename,
        152
      );
    }
  }
  
  /**
   * Singleton instance oluşturma
   */
  public static getInstance(options?: ApplicationMonitorOptions): ApplicationMonitorService {
    if (!ApplicationMonitorService.instance) {
      ApplicationMonitorService.instance = new ApplicationMonitorService(options);
    }
    return ApplicationMonitorService.instance;
  }
  
  /**
   * İzlemeyi başlat
   */
  public startMonitoring(): void {
    if (this.monitoringIntervalId) {
      logger.warn(
        'İzleme zaten çalışıyor, yeniden başlatılıyor',
        'ApplicationMonitorService.startMonitoring',
        __filename,
        174
      );
      clearInterval(this.monitoringIntervalId);
    }
    
    this.monitoringIntervalId = setInterval(() => {
      this.checkHealth();
    }, this.sampleInterval);
    
    logger.info(
      `İzleme başlatıldı, aralık: ${this.sampleInterval}ms`,
      'ApplicationMonitorService.startMonitoring',
      __filename,
      185
    );
  }
  
  /**
   * İzlemeyi durdur
   */
  public stopMonitoring(): void {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = undefined;
      
      logger.info(
        'İzleme durduruldu',
        'ApplicationMonitorService.stopMonitoring',
        __filename,
        199
      );
    }
  }
  
  /**
   * Performans gözlemcisini kur
   */
  private setupPerformanceObserver(): void {
    if (!this.enablePerformanceMonitoring) return;
    
    try {
      // PerformanceObserver'ı destekliyor mu?
      if ('PerformanceObserver' in window) {
        // Uzun görevleri izle
        if (typeof PerformanceObserver !== 'undefined') {
          try {
            const longTaskObserver = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                this.longTasks.push(entry.duration);
                this.trimHistory(this.longTasks);
                
                if (entry.duration > this.longTaskThreshold) {
                  logger.debug(
                    `Uzun görev tespit edildi: ${entry.duration.toFixed(2)}ms`,
                    'ApplicationMonitorService.longTaskObserver',
                    __filename,
                    226,
                    { duration: entry.duration }
                  );
                }
              });
            });
            
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            
            logger.debug(
              'Uzun görev gözlemcisi başlatıldı',
              'ApplicationMonitorService.setupPerformanceObserver',
              __filename,
              237
            );
          } catch (error) {
            logger.warn(
              'Uzun görev gözlemcisi başlatılamadı',
              'ApplicationMonitorService.setupPerformanceObserver',
              __filename,
              243,
              { error }
            );
          }
          
          // Kaynak yüklemelerini izle
          try {
            const resourceObserver = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                // PerformanceResourceTiming tipine dönüştür
                if (entry.entryType === 'resource') {
                  const resourceEntry = entry as PerformanceResourceTiming;
                  const resourceType = resourceEntry.initiatorType;
                  
                  switch (resourceType) {
                    case 'script':
                      this.metrics.resourceLoads.js++;
                      break;
                    case 'css':
                    case 'link':
                      this.metrics.resourceLoads.css++;
                      break;
                    case 'img':
                      this.metrics.resourceLoads.image++;
                      break;
                    default:
                      this.metrics.resourceLoads.other++;
                      break;
                  }
                }
              });
            });
            
            resourceObserver.observe({ entryTypes: ['resource'] });
            
            logger.debug(
              'Kaynak gözlemcisi başlatıldı',
              'ApplicationMonitorService.setupPerformanceObserver',
              __filename,
              273
            );
          } catch (error) {
            logger.warn(
              'Kaynak gözlemcisi başlatılamadı',
              'ApplicationMonitorService.setupPerformanceObserver',
              __filename,
              279,
              { error }
            );
          }
        }
      }
    } catch (error) {
      logger.warn(
        'Performans gözlemcisi konfigürasyonu başarısız',
        'ApplicationMonitorService.setupPerformanceObserver',
        __filename,
        289,
        { error }
      );
    }
  }
  
  /**
   * Hata işleyicileri kur
   */
  private setupErrorHandlers(): void {
    if (!this.enableErrorMonitoring) return;
    
    try {
      // Global hata yakalama
      window.addEventListener('error', (event) => {
        if (event.error) {
          this.errorHistory.push(event.error);
          this.trimHistory(this.errorHistory);
          
          logger.error(
            `Yakalanmamış hata: ${event.message}`,
            'ApplicationMonitorService.errorHandler',
            __filename,
            310,
            { 
              message: event.message,
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno
            }
          );
        }
      });
      
      // İşlenmeyen promise hataları
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.errorHistory.push(error);
        this.trimHistory(this.errorHistory);
        
        logger.error(
          `İşlenmemiş Promise hatası: ${error.message}`,
          'ApplicationMonitorService.unhandledRejection',
          __filename,
          329,
          { error }
        );
      });
      
      logger.debug(
        'Hata işleyicileri başlatıldı',
        'ApplicationMonitorService.setupErrorHandlers',
        __filename,
        336
      );
    } catch (error) {
      logger.warn(
        'Hata işleyicileri başlatılamadı',
        'ApplicationMonitorService.setupErrorHandlers',
        __filename,
        342,
        { error }
      );
    }
  }
  
  /**
   * Uygulama sağlık durumunu kontrol et
   */
  private checkHealth(): void {
    const now = new Date();
    this.health.lastChecked = now;
    
    // Bellek durumunu kontrol et
    if (this.enableMemoryMonitoring) {
      this.checkMemoryHealth();
    }
    
    // API durumunu kontrol et
    if (this.enableApiMonitoring) {
      this.checkApiHealth();
    }
    
    // Hata durumunu kontrol et
    if (this.enableErrorMonitoring) {
      this.checkErrorHealth();
    }
    
    // Frontend performansını kontrol et
    if (this.enablePerformanceMonitoring) {
      this.checkFrontendHealth();
    }
    
    // Genel sağlık durumunu belirle
    this.determineOverallHealth();
    
    // Sağlık durumunu logla
    this.logHealthStatus();
    
    flowTracker.trackStep(
      'Custom' as FlowCategory,
      'Sağlık kontrolü yapıldı', 
      'ApplicationMonitorService.checkHealth',
      { status: this.health.status }
    );
  }
  
  /**
   * Bellek sağlık durumunu kontrol et
   */
  private checkMemoryHealth(): void {
    if (window.performance) {
      const perf = window.performance as PerformanceWithMemory;
      if (perf.memory) {
        const memoryInfo = perf.memory;
        this.metrics.memory = {
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          usedJSHeapSize: memoryInfo.usedJSHeapSize
        };
        
        // Bellek kullanım yüzdesi
        const usagePercent = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit * 100;
        
        if (usagePercent > 90) {
          this.health.checks.memory.status = 'error';
          this.health.checks.memory.details = `Bellek kullanımı kritik seviyede: %${usagePercent.toFixed(1)}`;
        } else if (usagePercent > 70) {
          this.health.checks.memory.status = 'warning';
          this.health.checks.memory.details = `Bellek kullanımı yüksek: %${usagePercent.toFixed(1)}`;
        } else {
          this.health.checks.memory.status = 'ok';
          this.health.checks.memory.details = `Bellek kullanımı normal: %${usagePercent.toFixed(1)}`;
        }
      }
    }
  }
  
  /**
   * API sağlık durumunu kontrol et
   */
  private checkApiHealth(): void {
    // API çağrılarının ortalama gecikme süresi
    let totalLatency = 0;
    let totalCalls = 0;
    let totalErrors = 0;
    
    for (const endpoint in this.apiCalls) {
      const { times, errors } = this.apiCalls[endpoint];
      totalLatency += times.reduce((sum, time) => sum + time, 0);
      totalCalls += times.length;
      totalErrors += errors;
    }
    
    const averageLatency = totalCalls > 0 ? totalLatency / totalCalls : 0;
    this.health.checks.api.latency = averageLatency;
    this.health.checks.api.failures = totalErrors;
    
    // Sağlık durumunu belirle
    if (totalErrors > this.errorThreshold || averageLatency > this.apiLatencyThreshold * 2) {
      this.health.checks.api.status = 'error';
      this.health.checks.api.details = `API hata sayısı: ${totalErrors}, Ortalama gecikme: ${averageLatency.toFixed(1)}ms`;
    } else if (totalErrors > 0 || averageLatency > this.apiLatencyThreshold) {
      this.health.checks.api.status = 'warning';
      this.health.checks.api.details = `API hata sayısı: ${totalErrors}, Ortalama gecikme: ${averageLatency.toFixed(1)}ms`;
    } else {
      this.health.checks.api.status = 'ok';
      this.health.checks.api.details = `API çağrıları normal: ${totalCalls} çağrı, ${averageLatency.toFixed(1)}ms ortalama gecikme`;
    }
  }
  
  /**
   * Hata sağlık durumunu kontrol et
   */
  private checkErrorHealth(): void {
    const errorCount = this.errorHistory.length;
    this.health.checks.errors.count = errorCount;
    
    if (errorCount > this.errorThreshold * 2) {
      this.health.checks.errors.status = 'error';
      this.health.checks.errors.details = `Kritik hata sayısı: ${errorCount}`;
    } else if (errorCount > this.errorThreshold) {
      this.health.checks.errors.status = 'warning';
      this.health.checks.errors.details = `Yüksek hata sayısı: ${errorCount}`;
    } else {
      this.health.checks.errors.status = 'ok';
      this.health.checks.errors.details = `Hata sayısı normal: ${errorCount}`;
    }
  }
  
  /**
   * Frontend sağlık durumunu kontrol et
   */
  private checkFrontendHealth(): void {
    // Uzun görevleri kontrol et
    const longTaskCount = this.longTasks.filter(duration => duration > this.longTaskThreshold).length;
    
    // Render sürelerini kontrol et
    let totalRenderTime = 0;
    let totalRenderCount = 0;
    
    for (const component in this.renderTimeHistory) {
      const times = this.renderTimeHistory[component];
      totalRenderTime += times.reduce((sum, time) => sum + time, 0);
      totalRenderCount += times.length;
    }
    
    const averageRenderTime = totalRenderCount > 0 ? totalRenderTime / totalRenderCount : 0;
    this.health.checks.frontend.renderTimes = averageRenderTime;
    
    if (longTaskCount > 10 || averageRenderTime > 100) {
      this.health.checks.frontend.status = 'error';
      this.health.checks.frontend.details = `Uzun görev sayısı: ${longTaskCount}, Ort. render süresi: ${averageRenderTime.toFixed(1)}ms`;
    } else if (longTaskCount > 5 || averageRenderTime > 50) {
      this.health.checks.frontend.status = 'warning';
      this.health.checks.frontend.details = `Uzun görev sayısı: ${longTaskCount}, Ort. render süresi: ${averageRenderTime.toFixed(1)}ms`;
    } else {
      this.health.checks.frontend.status = 'ok';
      this.health.checks.frontend.details = `Frontend performansı normal: ${longTaskCount} uzun görev, ${averageRenderTime.toFixed(1)}ms ort. render süresi`;
    }
  }
  
  /**
   * Genel sağlık durumunu belirle
   */
  private determineOverallHealth(): void {
    const checks = this.health.checks;
    const hasErrorChecks = 
      checks.memory.status === 'error' || 
      checks.api.status === 'error' || 
      checks.errors.status === 'error' || 
      checks.frontend.status === 'error';
    
    const hasWarningChecks = 
      checks.memory.status === 'warning' || 
      checks.api.status === 'warning' || 
      checks.errors.status === 'warning' || 
      checks.frontend.status === 'warning';
    
    if (hasErrorChecks) {
      this.health.status = 'unhealthy';
    } else if (hasWarningChecks) {
      this.health.status = 'degraded';
    } else {
      this.health.status = 'healthy';
    }
  }
  
  /**
   * Sağlık durumunu logla
   */
  private logHealthStatus(): void {
    const { status } = this.health;
    
    // Log seviyesini duruma göre belirle
    if (status === 'unhealthy') {
      logger.error(
        `Uygulama sağlık durumu: UNHEALTHY`,
        'ApplicationMonitorService.logHealthStatus',
        __filename,
        535,
        { health: this.health }
      );
    } else if (status === 'degraded') {
      logger.warn(
        `Uygulama sağlık durumu: DEGRADED`,
        'ApplicationMonitorService.logHealthStatus',
        __filename,
        543,
        { health: this.health }
      );
    } else {
      logger.debug(
        `Uygulama sağlık durumu: HEALTHY`,
        'ApplicationMonitorService.logHealthStatus',
        __filename,
        551,
        { health: this.health }
      );
    }
  }
  
  /**
   * API çağrısını kaydet
   */
  public trackApiCall(endpoint: string, duration: number, isError: boolean = false): void {
    if (!this.enableApiMonitoring) return;
    
    if (!this.apiCalls[endpoint]) {
      this.apiCalls[endpoint] = { times: [], errors: 0 };
    }
    
    this.apiCalls[endpoint].times.push(duration);
    if (isError) {
      this.apiCalls[endpoint].errors++;
    }
    
    this.trimHistory(this.apiCalls[endpoint].times);
    
    // API gecikme verilerini güncelle
    this.metrics.apiLatency.push(duration);
    this.trimHistory(this.metrics.apiLatency);
  }
  
  /**
   * Bileşen render süresini kaydet
   */
  public trackRenderTime(componentName: string, duration: number): void {
    if (!this.enablePerformanceMonitoring) return;
    
    if (!this.renderTimeHistory[componentName]) {
      this.renderTimeHistory[componentName] = [];
    }
    
    this.renderTimeHistory[componentName].push(duration);
    this.trimHistory(this.renderTimeHistory[componentName]);
    
    // Metrics'teki render sürelerini güncelle
    if (!this.metrics.renderTimes[componentName]) {
      this.metrics.renderTimes[componentName] = [];
    }
    
    this.metrics.renderTimes[componentName].push(duration);
    this.trimHistory(this.metrics.renderTimes[componentName]);
  }
  
  /**
   * Geçmiş dizisini maksimum boyuta göre kırp
   */
  private trimHistory<T>(history: T[]): void {
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }
  
  /**
   * Mevcut sağlık durumunu getir
   */
  public getHealthStatus(): ApplicationHealth {
    return { ...this.health };
  }
  
  /**
   * Mevcut performans metriklerini getir
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * API çağrı istatistiklerini getir
   */
  public getApiStats(): Record<string, { times: number[], errors: number }> {
    const result: Record<string, { times: number[], errors: number }> = {};
    
    for (const endpoint in this.apiCalls) {
      result[endpoint] = {
        times: [...this.apiCalls[endpoint].times],
        errors: this.apiCalls[endpoint].errors
      };
    }
    
    return result;
  }
  
  /**
   * Render süresi istatistiklerini getir
   */
  public getRenderTimeStats(): Record<string, number[]> {
    const result: Record<string, number[]> = {};
    
    for (const component in this.renderTimeHistory) {
      result[component] = [...this.renderTimeHistory[component]];
    }
    
    return result;
  }
  
  /**
   * Hata geçmişini getir
   */
  public getErrorHistory(): Error[] {
    return [...this.errorHistory];
  }
  
  /**
   * Servis yapılandırmasını güncelle
   */
  public configure(options: Partial<ApplicationMonitorOptions>): void {
    if (options.sampleInterval !== undefined) this.sampleInterval = options.sampleInterval;
    if (options.errorThreshold !== undefined) this.errorThreshold = options.errorThreshold;
    if (options.apiLatencyThreshold !== undefined) this.apiLatencyThreshold = options.apiLatencyThreshold;
    if (options.longTaskThreshold !== undefined) this.longTaskThreshold = options.longTaskThreshold;
    if (options.maxHistorySize !== undefined) this.maxHistorySize = options.maxHistorySize;
    if (options.enablePerformanceMonitoring !== undefined) this.enablePerformanceMonitoring = options.enablePerformanceMonitoring;
    if (options.enableMemoryMonitoring !== undefined) this.enableMemoryMonitoring = options.enableMemoryMonitoring;
    if (options.enableApiMonitoring !== undefined) this.enableApiMonitoring = options.enableApiMonitoring;
    if (options.enableErrorMonitoring !== undefined) this.enableErrorMonitoring = options.enableErrorMonitoring;
    
    // İzleme döngüsünü yeniden başlat
    if (this.monitoringIntervalId) {
      this.stopMonitoring();
      this.startMonitoring();
    }
    
    logger.info(
      'Servis yapılandırması güncellendi',
      'ApplicationMonitorService.configure',
      __filename,
      678,
      { options }
    );
  }
  
  /**
   * Servisi sıfırla
   */
  public reset(): void {
    this.apiCalls = {};
    this.longTasks = [];
    this.renderTimeHistory = {};
    this.errorHistory = [];
    
    this.metrics = {
      fps: 0,
      memory: {},
      apiLatency: [],
      renderTimes: {},
      longTasks: 0,
      resourceLoads: {
        js: 0,
        css: 0,
        image: 0,
        other: 0
      }
    };
    
    logger.info(
      'ApplicationMonitorService sıfırlandı',
      'ApplicationMonitorService.reset',
      __filename,
      704
    );
  }
}

// Helper işlevler
export function getApplicationMonitor(options?: ApplicationMonitorOptions): ApplicationMonitorService {
  return ApplicationMonitorService.getInstance(options);
}

export function trackApiCallPerformance(
  endpoint: string,
  duration: number,
  isError: boolean = false
): void {
  const monitor = getApplicationMonitor();
  monitor.trackApiCall(endpoint, duration, isError);
}

export function trackComponentRender(
  componentName: string,
  duration: number
): void {
  const monitor = getApplicationMonitor();
  monitor.trackRenderTime(componentName, duration);
}

export default ApplicationMonitorService; 