/**
 * @file flow-tracker.service.ts
 * @description Frontend uygulama durum akışını ve yaşam döngüsünü izleyen servis
 */

import { LoggerService } from './logger.service';

/**
 * İzlenebilecek akış kategorileri
 */
export enum FlowCategory {
  Navigation = 'Navigation',  // Sayfa gezintileri
  Component = 'Component',    // Bileşen yaşam döngüsü
  State = 'State',            // Durum değişiklikleri
  API = 'API',                // API çağrıları
  Auth = 'Auth',              // Kimlik doğrulama işlemleri
  Render = 'Render',          // Render performansı
  User = 'User',              // Kullanıcı etkileşimleri
  Error = 'Error',            // Hata izleme
  Custom = 'Custom'           // Özel kategoriler
}

/**
 * Akış izleme seçenekleri
 */
interface FlowTrackerOptions {
  enabled?: boolean;
  categories?: FlowCategory[];
  traceRenders?: boolean;
  traceStateChanges?: boolean;
  traceApiCalls?: boolean;
  captureTimings?: boolean;
  consoleOutput?: boolean;
  logger?: LoggerService;
  allowedContexts?: string[]; // İzin verilen context'ler listesi
}

/**
 * Bir akış izleme adımı
 */
interface FlowStep {
  id: string;
  timestamp: number;
  category: FlowCategory;
  message: string;
  context: string;
  timing?: number;
  metadata?: Record<string, unknown>;
}

/**
 * İzlenen akışları gruplayarak değerlendirir
 */
interface FlowSequence {
  id: string;
  name: string;
  steps: FlowStep[];
  startTime: number;
  endTime?: number;
  totalDuration?: number;
}

/**
 * Bir akış izleyici - startFlow ile oluşturulan ve trackStep'i yöneten sınıf
 */
export class FlowTracker {
  constructor(
    private service: FlowTrackerService,
    private id: string,
    private category: FlowCategory,
    private name: string
  ) {}

  /**
   * Bir akış adımı izler ve aynı flow context'inde kaydeder
   */
  trackStep(step: string, metadata?: Record<string, unknown>): FlowTracker {
    this.service.trackStep(
      this.category,
      step,
      `Flow:${this.name}`,
      {
        flowId: this.id,
        flowName: this.name,
        ...metadata
      }
    );
    return this;
  }

  /**
   * Akışı sonlandırır ve özet bilgiyi döndürür
   */
  end(summary?: string): void {
    this.service.trackStep(
      this.category,
      summary || `Flow tamamlandı: ${this.name}`,
      `Flow:${this.name}`,
      {
        flowId: this.id,
        flowName: this.name,
        status: 'completed'
      }
    );
  }
}

/**
 * Frontend Akış İzleme Servisi
 * Uygulama içindeki akışları, bileşen yaşam döngülerini ve performans metriklerini izler
 */
export class FlowTrackerService {
  startFlow(category: FlowCategory, name: string): FlowTracker {
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.trackStep(category, `Flow başlatıldı: ${name}`, 'FlowTracker');
    return new FlowTracker(this, flowId, category, name);
  }

  private static instance: FlowTrackerService;
  private enabled: boolean;
  private enabledCategories: Set<FlowCategory>;
  private traceRenders: boolean;
  private traceStateChanges: boolean;
  private traceApiCalls: boolean;
  private captureTimings: boolean;
  private consoleOutput: boolean;
  private allowedContexts: Set<string>;
  private steps: FlowStep[] = [];
  private sequences: Map<string, FlowSequence> = new Map();
  private activeSequences: Set<string> = new Set();
  private logger?: LoggerService;
  private stepCount = 0;
  private sequenceCount = 0;
  private timingMarks: Map<string, number> = new Map();
  
  private constructor(options: FlowTrackerOptions = {}) {
    this.enabled = options.enabled ?? process.env.NODE_ENV !== 'production';
    this.enabledCategories = new Set(options.categories || [
      FlowCategory.Navigation,
      FlowCategory.Component,
      FlowCategory.State,
      FlowCategory.API,
      FlowCategory.Auth,
      FlowCategory.User,
      FlowCategory.Error,
      FlowCategory.Custom
    ]);
    
    // Sadece belirli context'lerde loglama yapılmasını sağla
    let allowedContexts: string[] = ['AuthService', 'NavigationService', 'AppComponent']; // Varsayılan değerler
    
    if (typeof window !== 'undefined') {
      // Browser ortamındayız, localStorage kullanabiliriz
      const storedContexts = localStorage.getItem('flow_tracker_allowed_contexts');
      if (storedContexts) {
        try {
          allowedContexts = JSON.parse(storedContexts);
        } catch (e) {
          console.error('Flow tracker allowed contexts parse hatası:', e);
        }
      }
    }
    
    this.allowedContexts = new Set(allowedContexts);
    
    this.traceRenders = options.traceRenders ?? false;
    this.traceStateChanges = options.traceStateChanges ?? true;
    this.traceApiCalls = options.traceApiCalls ?? true;
    this.captureTimings = options.captureTimings ?? true;
    this.consoleOutput = options.consoleOutput ?? true;
    this.logger = options.logger;
    
    // Render izleme aktifse performans API'sini de etkinleştir
    if (this.traceRenders && typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
    
    // Sayfa gezinimlerini otomatik izle
    if (typeof window !== 'undefined') {
      this.setupNavigationTracking();
    }

    console.log('🔍 Akış izleyici başlatıldı - Tüm program akışı terminalda görüntülenecek');
  }
  
  /**
   * Singleton instance oluşturma
   */
  public static getInstance(options?: FlowTrackerOptions): FlowTrackerService {
    if (!FlowTrackerService.instance) {
      FlowTrackerService.instance = new FlowTrackerService(options);
    }
    return FlowTrackerService.instance;
  }
  
  /**
   * Performans gözlemcisini ayarlar
   */
  private setupPerformanceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure' && entry.name.startsWith('render_')) {
            const componentName = entry.name.replace('render_', '');
            this.trackTiming(FlowCategory.Render, `${componentName} bileşeni render edildi`, componentName, entry.duration);
          }
        });
      });
      
      observer.observe({ entryTypes: ['measure'], buffered: true });
    } catch (error) {
      console.error('Performans gözlemcisi oluşturulamadı:', error);
    }
  }
  
  /**
   * Sayfa gezinimlerini izlemeyi ayarlar
   */
  private setupNavigationTracking(): void {
    // Sayfa yüklendiğinde
    window.addEventListener('load', () => {
      this.trackStep(FlowCategory.Navigation, 'Sayfa yüklendi', 'Browser', {
        url: window.location.href,
        title: document.title
      });
    });
    
    // Sayfalar arası geçişleri izlemek için history API'larını dinle
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
      return result;
    };
    
    window.addEventListener('pushstate', () => {
      this.trackStep(FlowCategory.Navigation, 'Sayfa geçişi yapıldı', 'History', {
        url: window.location.href
      });
    });
    
    window.addEventListener('popstate', () => {
      this.trackStep(FlowCategory.Navigation, 'Geri/ileri tuşu kullanıldı', 'History', {
        url: window.location.href
      });
    });
  }
  
  /**
   * Temel bir akış adımı kaydeder
   */
  public trackStep(
    category: FlowCategory,
    message: string,
    context: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled || 
        !this.enabledCategories.has(category) ||
        (this.allowedContexts.size > 0 && (!context || !this.allowedContexts.has(context)))) {
      return;
    }
    
    const timestamp = Date.now();
    const stepId = `flow_step_${++this.stepCount}`;
    
    const step: FlowStep = {
      id: stepId,
      timestamp,
      category,
      message,
      context,
      metadata
    };
    
    this.steps.push(step);
    
    // Aktif sekanslara adımı ekle
    this.activeSequences.forEach(sequenceId => {
      const sequence = this.sequences.get(sequenceId);
      if (sequence) {
        sequence.steps.push(step);
      }
    });
    
    // Konsola log
    if (this.consoleOutput) {
      this.consoleLogStepWithColor(step);
    }
    
    // Logger servisine gönder
    if (this.logger) {
      this.logger.info(
        `Flow: ${message}`,
        `FlowTracker.${category}.${context}`,
        undefined,
        undefined,
        { flowCategory: category, ...metadata }
      );
    }
  }
  
  /**
   * Zamanlama bilgisi ile adım izler
   */
  public trackTiming(
    category: FlowCategory,
    message: string,
    context: string,
    timing: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.enabled || 
        !this.enabledCategories.has(category) ||
        (this.allowedContexts.size > 0 && (!context || !this.allowedContexts.has(context)))) {
      return;
    }
    
    const timestamp = Date.now();
    const stepId = `flow_timing_${++this.stepCount}`;
    
    const step: FlowStep = {
      id: stepId,
      timestamp,
      category,
      message,
      context,
      timing,
      metadata
    };
    
    this.steps.push(step);
    
    // Aktif sekanslara adımı ekle
    this.activeSequences.forEach(sequenceId => {
      const sequence = this.sequences.get(sequenceId);
      if (sequence) {
        sequence.steps.push(step);
      }
    });
    
    // Konsola log
    if (this.consoleOutput) {
      this.consoleLogTiming(step);
    }
    
    // Logger servisine gönder
    if (this.logger && timing > 0) {
      this.logger.info(
        `Timing: ${message} (${timing.toFixed(2)}ms)`,
        `FlowTracker.Timing.${context}`,
        undefined,
        undefined,
        { 
          flowCategory: category,
          timing,
          ...metadata
        }
      );
    }
  }
  
  /**
   * Bileşenin yaşam döngüsü olayını izler
   */
  public trackComponent(
    componentName: string,
    lifecycle: 'mount' | 'update' | 'unmount',
    props?: Record<string, unknown>
  ): void {
    const message = `Bileşen ${lifecycle === 'mount' ? 'monte edildi' : 
      lifecycle === 'update' ? 'güncellendi' : 'kaldırıldı'}`;
    
    this.trackStep(FlowCategory.Component, message, componentName, {
      lifecycle,
      props: props ? this.safeStringify(props) : undefined
    });
  }
  
  /**
   * Durum değişikliğini izler
   */
  public trackStateChange(
    stateName: string,
    context: string,
    oldValue: unknown,
    newValue: unknown
  ): void {
    if (!this.traceStateChanges) {
      return;
    }
    
    this.trackStep(FlowCategory.State, `${stateName} durumu değişti`, context, {
      stateName,
      oldValue: this.safeStringify(oldValue),
      newValue: this.safeStringify(newValue)
    });
  }
  
  /**
   * API çağrısını izler
   */
  public trackApiCall(
    endpoint: string,
    method: string,
    context: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.traceApiCalls) {
      return;
    }
    
    this.trackStep(FlowCategory.API, `${method} ${endpoint}`, context, {
      endpoint,
      method,
      ...metadata
    });
  }
  
  /**
   * Kullanıcı etkileşimini izler
   */
  public trackUserInteraction(
    action: string,
    element: string,
    context: string,
    metadata?: Record<string, unknown>
  ): void {
    this.trackStep(FlowCategory.User, `Kullanıcı ${action} - ${element}`, context, metadata);
  }
  
  /**
   * Yeni bir akış sekansı başlatır
   */
  public startSequence(name: string): string {
    if (!this.enabled) {
      return '';
    }
    
    const sequenceId = `flow_seq_${++this.sequenceCount}`;
    const startTime = Date.now();
    
    const sequence: FlowSequence = {
      id: sequenceId,
      name,
      steps: [],
      startTime
    };
    
    this.sequences.set(sequenceId, sequence);
    this.activeSequences.add(sequenceId);
    
    if (this.consoleOutput) {
      console.group(`🔄 Flow Sequence: ${name}`);
    }
    
    if (this.logger) {
      this.logger.info(
        `Flow sekansı başladı: ${name}`,
        'FlowTracker.Sequence',
        undefined,
        undefined,
        { sequenceId, name }
      );
    }
    
    return sequenceId;
  }
  
  /**
   * Akış sekansını bitirir
   */
  public endSequence(sequenceId: string): FlowSequence | undefined {
    if (!this.enabled || !this.sequences.has(sequenceId)) {
      return undefined;
    }
    
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return undefined;
    
    const endTime = Date.now();
    sequence.endTime = endTime;
    sequence.totalDuration = endTime - sequence.startTime;
    
    this.activeSequences.delete(sequenceId);
    
    if (this.consoleOutput) {
      console.log(`✅ Flow Sequence completed: ${sequence.name} (${sequence.totalDuration}ms)`);
      console.groupEnd();
    }
    
    if (this.logger) {
      this.logger.info(
        `Flow sekansı tamamlandı: ${sequence.name}`,
        'FlowTracker.Sequence',
        undefined,
        undefined,
        { 
          sequenceId, 
          name: sequence.name, 
          duration: sequence.totalDuration,
          stepsCount: sequence.steps.length
        }
      );
    }
    
    return sequence;
  }
  
  /**
   * Performans ölçümüne başlar
   */
  public markStart(name: string): void {
    if (!this.captureTimings) {
      return;
    }
    
    this.timingMarks.set(name, performance.now());
  }
  
  /**
   * Performans ölçümünü bitirir ve süreyi kaydeder
   */
  public markEnd(name: string, category: FlowCategory, context: string): number {
    if (!this.captureTimings || !this.timingMarks.has(name)) {
      return 0;
    }
    
    const startTime = this.timingMarks.get(name)!;
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.trackTiming(
      category,
      `${name} tamamlandı`,
      context,
      duration
    );
    
    this.timingMarks.delete(name);
    return duration;
  }
  
  /**
   * Zamanlayıcı kodu çalıştırır ve süresini ölçer
   */
  public async measureAsync<T>(
    name: string,
    category: FlowCategory,
    context: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.markStart(name);
    try {
      return await fn();
    } finally {
      this.markEnd(name, category, context);
    }
  }
  
  /**
   * Senkron fonksiyonu ölçer
   */
  public measure<T>(
    name: string,
    category: FlowCategory,
    context: string,
    fn: () => T
  ): T {
    this.markStart(name);
    try {
      return fn();
    } finally {
      this.markEnd(name, category, context);
    }
  }
  
  /**
   * Adımı renkli olarak konsola yazdırır
   */
  private consoleLogStepWithColor(step: FlowStep): void {
    const timestamp = new Date(step.timestamp).toISOString().split('T')[1].slice(0, -1);
    let categoryStyle = 'color: #3498db'; // Varsayılan mavi renk
    let icon = '🔹';
    
    // Kategoriye göre renk ve ikon belirle
    switch (step.category) {
      case FlowCategory.Navigation:
        categoryStyle = 'color: #2ecc71; font-weight: bold'; // Yeşil
        icon = '🧭';
        break;
      case FlowCategory.Component:
        categoryStyle = 'color: #9b59b6'; // Mor
        icon = '🧩';
        break;
      case FlowCategory.State:
        categoryStyle = 'color: #f39c12; font-weight: bold'; // Turuncu
        icon = '📊';
        break;
      case FlowCategory.API:
        categoryStyle = 'color: #3498db; font-weight: bold'; // Mavi
        icon = '🌐';
        break;
      case FlowCategory.Auth:
        categoryStyle = 'color: #1abc9c; font-weight: bold'; // Turkuaz
        icon = '🔐';
        break;
      case FlowCategory.User:
        categoryStyle = 'color: #27ae60'; // Yeşil
        icon = '👤';
        break;
      case FlowCategory.Error:
        categoryStyle = 'color: #e74c3c; font-weight: bold'; // Kırmızı
        icon = '❌';
        break;
      case FlowCategory.Render:
        categoryStyle = 'color: #8e44ad'; // Koyu mor
        icon = '🎨';
        break;
      case FlowCategory.Custom:
        categoryStyle = 'color: #34495e'; // Gri
        icon = '✨';
        break;
    }
    
    // Eğer zamanlama bilgisi varsa ekle
    const timingStr = step.timing ? ` (${step.timing.toFixed(1)}ms)` : '';
    
    console.log(
      `%c${timestamp} %c${icon} [${step.category}]%c [${step.context}] ${step.message}${timingStr}`,
      'color: #7f8c8d', // Zaman damgası gri
      categoryStyle,
      'color: #2c3e50' // Mesaj koyu gri
    );
    
    // Metadata varsa ekstra bilgileri de göster
    if (step.metadata && Object.keys(step.metadata).length > 0) {
      console.log(
        '%c├─ Detaylar:',
        'color: #7f8c8d',
        step.metadata
      );
    }
  }
  
  /**
   * Zamanlama adımını konsola yazar
   */
  private consoleLogTiming(step: FlowStep): void {
    const timestamp = new Date(step.timestamp).toISOString().split('T')[1].slice(0, -1);
    console.log(
      `[${timestamp}] %c${step.category}%c ${step.message} %c${step.context}%c (${step.timing?.toFixed(2)}ms)`,
      'color: #3498db; font-weight: bold',
      'color: #000',
      'color: #7f8c8d; font-style: italic',
      'color: #e74c3c; font-weight: bold',
      step.metadata
    );
  }
  
  /**
   * Akış izleyiciyi yapılandırır
   */
  public configure(options: Partial<FlowTrackerOptions>): void {
    if (options.enabled !== undefined) this.enabled = options.enabled;
    
    if (options.categories) {
      this.enabledCategories = new Set(options.categories);
    }
    
    if (options.allowedContexts) {
      this.allowedContexts = new Set(options.allowedContexts);
      
      // Browser ortamında localStorage'a kaydet
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('flow_tracker_allowed_contexts', JSON.stringify(Array.from(this.allowedContexts)));
        } catch (e) {
          console.error('Flow tracker allowed contexts kaydetme hatası:', e);
        }
      }
    }
    
    if (options.traceRenders !== undefined) this.traceRenders = options.traceRenders;
    if (options.traceStateChanges !== undefined) this.traceStateChanges = options.traceStateChanges;
    if (options.traceApiCalls !== undefined) this.traceApiCalls = options.traceApiCalls;
    if (options.captureTimings !== undefined) this.captureTimings = options.captureTimings;
    if (options.consoleOutput !== undefined) this.consoleOutput = options.consoleOutput;
    
    if (options.logger) {
      this.logger = options.logger;
    }
  }
  
  /**
   * Tüm adımları getirir
   */
  public getSteps(): FlowStep[] {
    return [...this.steps];
  }
  
  /**
   * Tüm sekansları getirir
   */
  public getSequences(): FlowSequence[] {
    return Array.from(this.sequences.values());
  }
  
  /**
   * İzleme geçmişini temizler
   */
  public clearHistory(): void {
    this.steps = [];
    this.sequences.clear();
    this.activeSequences.clear();
    this.stepCount = 0;
    this.sequenceCount = 0;
    this.timingMarks.clear();
  }
  
  /**
   * Nesneleri güvenli şekilde stringe çevirir
   */
  private safeStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'function') {
          return '[Function]';
        }
        if (value instanceof Element) {
          return `[Element: ${value.tagName}]`;
        }
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        }
        return value;
      }, 2);
    } catch (error) {
      return `[Stringify hatası: ${(error as Error).message}]`;
    }
  }
} 