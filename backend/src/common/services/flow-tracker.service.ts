import { Injectable } from '@nestjs/common';
import chalk from 'chalk';

/**
 * Akış kategorileri
 */
export enum FlowCategory {
  API = 'API', // API çağrıları
  Auth = 'Auth', // Kimlik doğrulama işlemleri
  DB = 'DB', // Veritabanı işlemleri
  Render = 'Render', // Render işlemleri
  Navigation = 'Navigation', // Sayfa gezintileri
  Component = 'Component', // Bileşen yaşam döngüsü
  State = 'State', // Durum değişiklikleri
  User = 'User', // Kullanıcı etkileşimleri
  Error = 'Error', // Hata izleme
  Custom = 'Custom', // Özel kategoriler
}

/**
 * Program akışı izleme servisi
 * Bu servis, uygulama içindeki işlem akışını terminalde görüntüler.
 * Sadece akış bilgisi terminale yazdırılır, hata mesajları terminale yazdırılmaz.
 */
@Injectable()
export class FlowTrackerService {
  private static instance: FlowTrackerService;
  private readonly isEnabled: boolean;
  private readonly enabledCategories: Set<FlowCategory>;

  constructor() {
    // Geliştirme ortamında akış izlemeyi etkinleştir
    this.isEnabled = process.env.NODE_ENV !== 'production';

    // Tüm kategorileri varsayılan olarak etkinleştir
    this.enabledCategories = new Set(Object.values(FlowCategory));

    FlowTrackerService.instance = this;
  }

  /**
   * Singleton pattern ile flow tracker instance'ı döndürür
   */
  public static getInstance(): FlowTrackerService {
    if (!FlowTrackerService.instance) {
      FlowTrackerService.instance = new FlowTrackerService();
    }
    return FlowTrackerService.instance;
  }

  /**
   * Belirtilen kategorileri etkinleştirir/devre dışı bırakır
   * @param categories Kategori listesi
   * @param enabled Etkinleştirme durumu
   */
  setCategories(categories: FlowCategory[], enabled: boolean = true): void {
    if (!this.isEnabled) return;

    categories.forEach((category) => {
      if (enabled) {
        this.enabledCategories.add(category);
      } else {
        this.enabledCategories.delete(category);
      }
    });
  }

  /**
   * Program akışını kategoriye göre terminale yazdırır
   * @param category Akış kategorisi
   * @param message Akış mesajı
   * @param context Akışın gerçekleştiği bağlam (sınıf/metod adı)
   */
  trackCategory(
    category: FlowCategory,
    message: string,
    context: string,
  ): void {
    if (!this.isEnabled || !this.enabledCategories.has(category)) {
      return;
    }

    const timestamp = new Date().toISOString();
    let categoryColor;

    // Kategoriye göre farklı renkler kullan
    switch (category) {
      case FlowCategory.API:
        categoryColor = chalk.magenta;
        break;
      case FlowCategory.Auth:
        categoryColor = chalk.cyan;
        break;
      case FlowCategory.DB:
        categoryColor = chalk.yellow;
        break;
      case FlowCategory.Error:
        categoryColor = chalk.red;
        break;
      default:
        categoryColor = chalk.blue;
    }

    console.log(
      `[${timestamp.split('T')[1].slice(0, -1)}] ${categoryColor(`[${category}]`)} ${chalk.yellow(
        `[${context}]`,
      )} ${message}`,
    );
  }

  /**
   * Program akışını terminale yazdırır (Eski metod, geriye dönük uyumluluk için)
   * @param message Akış mesajı
   * @param context Akışın gerçekleştiği bağlam (sınıf/metod adı)
   */
  track(message: string, context: string): void {
    this.trackCategory(FlowCategory.Custom, message, context);
  }

  /**
   * Hata akışını izler
   * @param message Hata mesajı
   * @param context Hatanın gerçekleştiği bağlam (sınıf/metod adı)
   */
  trackError(message: string, context: string): void {
    this.trackCategory(FlowCategory.Error, message, context);
  }

  /**
   * Bir metodun başlangıcını izler
   * @param methodName Metod adı
   * @param context Bağlam (sınıf adı)
   * @param params Metod parametreleri (hassas bilgiler içermemeli)
   */
  trackMethodStart(
    methodName: string,
    context: string,
    params?: Record<string, any>,
  ): void {
    if (!this.isEnabled) {
      return;
    }

    let message = `${chalk.green('➡️')} ${methodName} başladı`;

    if (params) {
      // Hassas verileri gizle (password, token vb.)
      const safeParams = { ...params };
      ['password', 'token', 'secret', 'key', 'auth'].forEach((key) => {
        if (key in safeParams) {
          safeParams[key] = '***gizli***';
        }
      });

      message += ` - Parametreler: ${JSON.stringify(safeParams)}`;
    }

    this.trackCategory(FlowCategory.Custom, message, context);
  }

  /**
   * Bir metodun bitişini izler
   * @param methodName Metod adı
   * @param context Bağlam (sınıf adı)
   * @param executionTimeMs Metodun çalışma süresi (ms)
   * @param result Metodun dönüş değeri (hassas bilgiler içermemeli)
   */
  trackMethodEnd(
    methodName: string,
    context: string,
    executionTimeMs?: number,
    result?: any,
  ): void {
    if (!this.isEnabled) {
      return;
    }

    let message = `${chalk.green('✅')} ${methodName} tamamlandı`;

    if (executionTimeMs !== undefined) {
      message += ` (${executionTimeMs}ms)`;
    }

    if (result !== undefined) {
      // Büyük nesneleri kısalt
      const resultStr = this.formatResult(result);
      if (resultStr) {
        message += ` - Sonuç: ${resultStr}`;
      }
    }

    this.trackCategory(FlowCategory.Custom, message, context);
  }

  /**
   * Bir işlem adımını izler
   * @param step Adım açıklaması
   * @param context Bağlam (sınıf/metod adı)
   */
  trackStep(step: string, context: string): void {
    this.trackCategory(
      FlowCategory.Custom,
      `${chalk.cyan('🔹')} ${step}`,
      context,
    );
  }

  /**
   * Bir API isteğini izler
   * @param method HTTP metodu
   * @param url İstek URL'i
   * @param context Bağlam (sınıf/metod adı)
   */
  trackApiRequest(method: string, url: string, context: string): void {
    this.trackCategory(
      FlowCategory.API,
      `${chalk.magenta('🌐')} ${method.toUpperCase()} ${url}`,
      context,
    );
  }

  /**
   * Bir API yanıtını izler
   * @param method HTTP metodu
   * @param url İstek URL'i
   * @param statusCode HTTP durum kodu
   * @param responseTime Yanıt süresi (ms)
   * @param context Bağlam (sınıf/metod adı)
   */
  trackApiResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context: string,
  ): void {
    if (!this.isEnabled) {
      return;
    }

    // Durum koduna göre renk
    let statusColor = chalk.green;
    if (statusCode >= 400) {
      statusColor = chalk.red;
    } else if (statusCode >= 300) {
      statusColor = chalk.yellow;
    }

    const message = `${chalk.magenta('🌐')} ${method.toUpperCase()} ${url} ${statusColor(
      `[${statusCode}]`,
    )} (${responseTime}ms)`;

    this.trackCategory(FlowCategory.API, message, context);
  }

  /**
   * Bir veritabanı işlemini izler
   * @param operation Veritabanı işlemi (query, insert, update, delete)
   * @param entity İlgili entity/tablo adı
   * @param executionTimeMs İşlem süresi (ms)
   * @param context Bağlam (sınıf/metod adı)
   */
  trackDbOperation(
    operation: string,
    entity: string,
    executionTimeMs: number,
    context: string,
  ): void {
    this.trackCategory(
      FlowCategory.DB,
      `${chalk.yellow('🗃️')} ${operation.toUpperCase()} ${entity} (${executionTimeMs}ms)`,
      context,
    );
  }

  /**
   * Sonuç nesnesini formatlar
   * @param result Formatlanacak sonuç nesnesi
   * @returns Formatlanmış sonuç string'i
   */
  private formatResult(result: any): string {
    if (result === undefined || result === null) {
      return '';
    }

    try {
      if (typeof result === 'object') {
        // Array ise uzunluğunu göster
        if (Array.isArray(result)) {
          return `Array[${result.length}]`;
        }

        // Büyük nesneleri kısalt
        const json = JSON.stringify(result);
        if (json.length > 100) {
          return `${json.substring(0, 100)}... (${json.length} karakter)`;
        }
        return json;
      }

      // Primitive değerler için doğrudan string'e çevir
      return String(result);
    } catch (error) {
      return '[Formatlanamayan Nesne]';
    }
  }
}
