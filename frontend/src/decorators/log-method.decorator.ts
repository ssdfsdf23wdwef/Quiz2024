/**
 * @file log-method.decorator.ts
 * @description Metot çağrılarını loglayan dekoratörler
 */

import { getLogger, getFlowTracker } from '../lib/logger.utils';

/**
 * Metot çağrılarını loglayan dekoratör
 * @param context Loglama bağlamı 
 * @param category Flow kategori adı (opsiyonel)
 * @returns Metot dekoratörü
 */
export function LogMethod(context: string, category: string = 'Custom') {
  return function (
    target: any, 
    propertyKey: string, 
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const logger = getLogger();
      const flowTracker = getFlowTracker();
      const className = target.constructor.name;
      const methodSignature = `${className}.${propertyKey}`;
      
      try {
        // Metot başlangıcını logla
        logger.debug(
          `Metot başlangıcı: ${methodSignature}`,
          context,
          'log-method.decorator.ts',
          30,
          { args: args.map(arg => typeof arg) }
        );
        
        // Akış izleme
        flowTracker.markStart(methodSignature);
        
        // Metodu çalıştır
        const result = originalMethod.apply(this, args);
        
        // Promise kontrolü
        if (result instanceof Promise) {
          return result.then(
            (value) => {
              // Başarı durumunda
              const duration = flowTracker.markEnd(methodSignature, category, context);
              logger.debug(
                `Metot tamamlandı: ${methodSignature}`,
                context,
                'log-method.decorator.ts',
                48,
                { duration, resultType: typeof value }
              );
              return value;
            },
            (error) => {
              // Hata durumunda
              const duration = flowTracker.markEnd(methodSignature, category, context);
              logger.error(
                `Metot hatası: ${methodSignature}`,
                context,
                'log-method.decorator.ts',
                58,
                { duration, error }
              );
              throw error;
            }
          );
        }
        
        // Senkron tamamlanma
        const duration = flowTracker.markEnd(methodSignature, category, context);
        logger.debug(
          `Metot tamamlandı: ${methodSignature}`,
          context,
          'log-method.decorator.ts',
          70,
          { duration, resultType: typeof result }
        );
        
        return result;
      } catch (error) {
        // Hata durumunda (senkron)
        const duration = flowTracker.markEnd(methodSignature, category, context);
        logger.error(
          `Metot hatası: ${methodSignature}`,
          context,
          'log-method.decorator.ts',
          81,
          { duration, error }
        );
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Sınıf metotlarını otomatik olarak loglayan dekoratör
 * @param context Loglama bağlamı
 * @param category Flow kategori adı (opsiyonel)
 * @returns Sınıf dekoratörü 
 */
export function LogClass(context: string, category: string = 'Custom') {
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    const className = constructor.name;
    
    // Prototip üzerindeki tüm metotları bul
    const prototype = constructor.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype)
      .filter(name => 
        name !== 'constructor' && 
        typeof prototype[name] === 'function'
      );
    
    // Her metoda LogMethod dekoratörünü uygula
    for (const propertyName of propertyNames) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyName);
      
      if (descriptor && typeof descriptor.value === 'function') {
        const originalMethod = descriptor.value;
        
        descriptor.value = function (...args: any[]) {
          const logger = getLogger();
          const flowTracker = getFlowTracker();
          const methodSignature = `${className}.${propertyName}`;
          
          try {
            // Metot başlangıcını logla
            logger.debug(
              `Metot başlangıcı: ${methodSignature}`,
              context,
              'log-method.decorator.ts',
              130,
              { args: args.map(arg => typeof arg) }
            );
            
            // Akış izleme
            flowTracker.markStart(methodSignature);
            
            // Metodu çalıştır
            const result = originalMethod.apply(this, args);
            
            // Promise kontrolü
            if (result instanceof Promise) {
              return result.then(
                (value) => {
                  // Başarı durumunda
                  const duration = flowTracker.markEnd(methodSignature, category, context);
                  logger.debug(
                    `Metot tamamlandı: ${methodSignature}`,
                    context,
                    'log-method.decorator.ts',
                    148,
                    { duration, resultType: typeof value }
                  );
                  return value;
                },
                (error) => {
                  // Hata durumunda
                  const duration = flowTracker.markEnd(methodSignature, category, context);
                  logger.error(
                    `Metot hatası: ${methodSignature}`,
                    context,
                    'log-method.decorator.ts',
                    158,
                    { duration, error }
                  );
                  throw error;
                }
              );
            }
            
            // Senkron tamamlanma
            const duration = flowTracker.markEnd(methodSignature, category, context);
            logger.debug(
              `Metot tamamlandı: ${methodSignature}`,
              context,
              'log-method.decorator.ts',
              170,
              { duration, resultType: typeof result }
            );
            
            return result;
          } catch (error) {
            // Hata durumunda (senkron)
            const duration = flowTracker.markEnd(methodSignature, category, context);
            logger.error(
              `Metot hatası: ${methodSignature}`,
              context,
              'log-method.decorator.ts',
              181,
              { duration, error }
            );
            throw error;
          }
        };
        
        Object.defineProperty(prototype, propertyName, descriptor);
      }
    }
    
    return constructor;
  };
}

/**
 * React hook'larını izleyen wrapper fonksiyon
 * @param hookName Hook adı
 * @param context Bağlam adı
 * @param hookFn Asıl hook fonksiyonu
 * @returns İzlenen hook
 */
export function trackHook<T extends (...args: any[]) => any>(
  hookName: string,
  context: string,
  hookFn: T
): T {
  return ((...args: any[]) => {
    const logger = getLogger();
    const flowTracker = getFlowTracker();
    const hookSignature = `${context}/${hookName}`;
    
    try {
      // Hook başlangıcını logla
      logger.debug(
        `Hook başlangıcı: ${hookName}`,
        context,
        'log-method.decorator.ts',
        216,
        { args: args.map(arg => typeof arg) }
      );
      
      // Akış izleme
      flowTracker.markStart(hookSignature);
      
      // Hook'u çalıştır
      const result = hookFn(...args);
      
      // Senkron tamamlanma
      const duration = flowTracker.markEnd(hookSignature, 'Component', context);
      logger.debug(
        `Hook tamamlandı: ${hookName}`,
        context,
        'log-method.decorator.ts',
        229,
        { duration, resultType: Array.isArray(result) ? 'array' : typeof result }
      );
      
      return result;
    } catch (error) {
      // Hata durumunda
      const duration = flowTracker.markEnd(hookSignature, 'Component', context);
      logger.error(
        `Hook hatası: ${hookName}`,
        context,
        'log-method.decorator.ts',
        240,
        { duration, error }
      );
      throw error;
    }
  }) as T;
} 