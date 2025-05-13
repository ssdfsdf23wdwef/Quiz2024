/**
 * @file zustand.middleware.ts
 * @description Zustand için loglama, durum değişikliği izleme ve performans middleware'leri
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { StateCreator, StoreApi } from 'zustand';
import { getLogger, getFlowTracker } from '../lib/logger.utils';

/**
 * Temel middleware tipi
 */
export type Middleware<T> = (
  config: StateCreator<T>
) => StateCreator<T>;

/**
 * Logger middleware
 * Tüm durum değişikliklerini loglar
 * @param storeName Store adı
 * @returns Middleware
 */
export const loggerMiddleware = <T extends object>(storeName: string): Middleware<T> => {
  return (config) => (set, get, api) => {
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    
    return config(
      (partial, replace) => {
        const previousState = get();
        set(partial, replace);
        const nextState = get();
        
        // Değişimleri belirle
        const changes: Record<string, { from: any; to: any }> = {};
        const isPartialFunction = typeof partial === 'function';
        const updatedKeys: string[] = [];
        
        Object.keys(nextState).forEach((key) => {
          if (previousState[key] !== nextState[key]) {
            changes[key] = { from: previousState[key], to: nextState[key] };
            updatedKeys.push(key);
          }
        });
        
        // Akış izleme
        flowTracker.trackStateChange(
          storeName,
          'ZustandStore',
          previousState,
          nextState
        );
        
        // Loglama
        logger.debug(
          `[${storeName}] Durum güncellendi: ${updatedKeys.join(', ')}`,
          'ZustandStore',
          'zustand.middleware.ts',
          49,
          {
            action: isPartialFunction ? 'Function' : 'Object',
            changes
          }
        );
        
        return nextState;
      },
      get,
      api
    );
  };
};

/**
 * Performans izleme middleware
 * Store aksiyonlarının çalışma süresini ölçer
 * @param storeName Store adı
 * @returns Middleware
 */
export const performanceMiddleware = <T extends object>(storeName: string): Middleware<T> => {
  return (config) => (set, get, api) => {
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    
    // Store işlem sayacı
    let actionCounter = 0;
    
    // Yeni API - Aksiyonları izlemek için imzalanmış metodlar ekler
    const trackedApi = Object.assign({}, api, {
      // Track fonksiyonu ekle
      trackAction: <F extends (...args: any[]) => any>(
        actionName: string,
        fn: F
      ): F => {
        return ((...args: any[]) => {
          actionCounter++;
          const actionId = `${storeName}:${actionName}:${actionCounter}`;
          
          // İşlem başlangıcını işaretle
          flowTracker.markStart(actionId);
          
          try {
            // İşlemi çalıştır
            const result = fn(...args);
            
            // Promise ise asenkron olarak ölç
            if (result instanceof Promise) {
              return result.then(
                // Başarılı
                (value) => {
                  const duration = flowTracker.markEnd(actionId, 'State', `${storeName}.${actionName}`);
                  logger.debug(
                    `Aksiyon tamamlandı: ${actionName}`,
                    `${storeName}`,
                    'zustand.middleware.ts',
                    97,
                    { duration, args: args.map(a => typeof a) }
                  );
                  return value;
                },
                // Hata
                (error) => {
                  const duration = flowTracker.markEnd(actionId, 'State', `${storeName}.${actionName}`);
                  logger.error(
                    `Aksiyon hatası: ${actionName}`,
                    `${storeName}`,
                    'zustand.middleware.ts',
                    106,
                    { duration, error }
                  );
                  throw error;
                }
              );
            }
            
            // Senkron işlem
            const duration = flowTracker.markEnd(actionId, 'State', `${storeName}.${actionName}`);
            logger.debug(
              `Aksiyon tamamlandı: ${actionName}`,
              `${storeName}`,
              'zustand.middleware.ts',
              117,
              { duration, synchronous: true }
            );
            return result;
          } catch (error) {
            // Hata durumunda
            const duration = flowTracker.markEnd(actionId, 'State', `${storeName}.${actionName}`);
            logger.error(
              `Aksiyon hatası: ${actionName}`,
              `${storeName}`,
              'zustand.middleware.ts',
              126,
              { duration, error }
            );
            throw error;
          }
        }) as F;
      }
    });
    
    // Set, get ve izlenen api ile store'u oluştur
    // @ts-ignore - Düzeltilmiş API için tip uyarısını yoksay
    return config(set, get, trackedApi);
  };
};

/**
 * Durumu localStorage'a kaydetme middleware'i
 * Sayfalar arası durum aktarımı için
 * @param storeName Store adı
 * @param whitelist Kaydedilecek alan isimleri (opsiyonel)
 * @returns Middleware
 */
export const persistMiddleware = <T extends object>(
  storeName: string,
  whitelist?: (keyof T)[]
): Middleware<T> => {
  return (config) => (set, get, api) => {
    // İlk yüklemede localStorage'dan verileri al
    const localStorageKey = `zustand_${storeName}`;
    const logger = getLogger();
    
    // Tarayıcı ortamı kontrolü
    const isBrowser = typeof window !== 'undefined';
    
    try {
      // Yalnızca tarayıcı ortamında localStorage'a erişim sağla
      if (isBrowser) {
        const persistedState = localStorage.getItem(localStorageKey);
        
        if (persistedState) {
          const parsed = JSON.parse(persistedState) as Partial<T>;
          
          // Başlangıç durumunu al
          const initialState = config(set, get, api) as T;
          
          // Sadece whitelist'te belirtilen alanları al
          const filteredState = whitelist 
            ? Object.fromEntries(
                Object.entries(parsed).filter(([key]) => 
                  whitelist.includes(key as keyof T)
                )
              ) 
            : parsed;
          
          // Birleştirilmiş durumu set et
          set({ ...initialState, ...filteredState });
        }
      }
    } catch (error) {
      logger.error(
        `Durum geri yükleme hatası: ${storeName}`,
        'persistMiddleware',
        'zustand.middleware.ts',
        179,
        { error }
      );
    }
    
    return config(
      (partial, replace) => {
        // Önce normal set işlemini gerçekleştir
        set(partial, replace);
        
        // Sonra güncel durumu localStorage'a kaydet (sadece tarayıcı ortamında)
        if (isBrowser) {
          try {
            const state = get();
            
            // Sadece whitelist'te belirtilen alanları kaydet
            const filteredState = whitelist
              ? Object.fromEntries(
                  Object.entries(state).filter(([key]) => 
                    whitelist.includes(key as keyof T)
                  )
                )
              : state;
            
            localStorage.setItem(localStorageKey, JSON.stringify(filteredState));
          } catch (error) {
            logger.error(
              `Durum kaydetme hatası: ${storeName}`,
              'persistMiddleware',
              'zustand.middleware.ts',
              203,
              { error }
            );
          }
        }
      },
      get,
      api
    );
  };
};

/**
 * Çoklu middleware uygulama yardımcısı
 * @param middlewares Uygulanacak middleware'ler
 * @returns Tek birleştirilmiş middleware
 */
export const composeMiddlewares = <T extends object>(
  middlewares: Middleware<T>[]
): Middleware<T> => {
  return (config) => 
    middlewares.reduce(
      (acc, middleware) => middleware(acc), 
      config
    );
};

/**
 * Zustand store oluşturucu fabrika fonksiyonu
 * Standart middleware'leri otomatik olarak ekler
 * @param createStore Store oluşturucu fonksiyon
 * @param storeName Store adı
 * @param options Opsiyonlar
 * @returns Middleware'ler eklenmiş store oluşturucu
 */
export const createTrackedStore = <T extends object, U>(
  createStore: (config: StateCreator<T>) => U,
  storeName: string,
  options?: {
    enableLogging?: boolean;
    enablePersist?: boolean;
    persistWhitelist?: (keyof T)[];
    enablePerformance?: boolean;
    additionalMiddlewares?: Middleware<T>[];
  }
): U => {
  const {
    enableLogging = process.env.NODE_ENV !== 'production',
    enablePersist = false,
    persistWhitelist,
    enablePerformance = process.env.NODE_ENV !== 'production',
    additionalMiddlewares = []
  } = options || {};
  
  // Uygulanacak middleware'leri topla
  const middlewares: Middleware<T>[] = [];
  
  if (enableLogging) {
    middlewares.push(loggerMiddleware(storeName));
  }
  
  if (enablePerformance) {
    middlewares.push(performanceMiddleware(storeName));
  }
  
  if (enablePersist) {
    middlewares.push(persistMiddleware(storeName, persistWhitelist));
  }
  
  // Kullanıcının eklediği middleware'leri ekle
  middlewares.push(...additionalMiddlewares);
  
  // Tüm middleware'leri uygula
  const composedMiddleware = composeMiddlewares(middlewares);
  
  // Bütün middleware'leri eklenmiş store'u oluştur
  return createStore(composedMiddleware((set, get, api) => {
    // Store initi izle
    const flowTracker = getFlowTracker();
    const logger = getLogger();
    
    logger.info(
      `${storeName} store başlatıldı`,
      'createTrackedStore',
      'zustand.middleware.ts',
      274
    );
    
    flowTracker.trackStep('State', `${storeName} store başlatıldı`, 'ZustandStore');
    
    // Store'un temel init fonksiyonunu çağır - burada kullanıcının kodu çalışacak
    return {
      _storeName: storeName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...(((_set, _get, _api) => ({})) as StateCreator<T>)(set, get, api)
    };
  }));
}; 