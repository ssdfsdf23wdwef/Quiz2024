import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';

/**
 * Metod çağrılarını otomatik olarak loglayan decorator
 * Bu decorator, bir metodun başlangıcını ve bitişini otomatik olarak izler.
 * Ayrıca hatalar oluştuğunda bunları otomatik olarak loglar.
 *
 * @param options Loglama seçenekleri
 * @returns Method decorator
 *
 * @example
 * ```typescript
 * @LogMethod()
 * async findAll(): Promise<User[]> {
 *   // ...
 * }
 *
 * @LogMethod({ trackParams: true, trackResult: true })
 * async findById(id: string): Promise<User> {
 *   // ...
 * }
 * ```
 */
export function LogMethod(
  options: {
    trackParams?: boolean;
    trackResult?: boolean;
    trackExecutionTime?: boolean;
  } = {},
) {
  const defaultOptions = {
    trackParams: false,
    trackResult: false,
    trackExecutionTime: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const logger = LoggerService.getInstance();
      const flowTracker = FlowTrackerService.getInstance();
      const startTime = Date.now();
      const contextName = `${className}.${methodName}`;

      try {
        // Metodun başlangıcını izle
        if (mergedOptions.trackParams) {
          const params = {};
          const paramNames = getParamNames(originalMethod);
          args.forEach((arg, index) => {
            params[paramNames[index] || `arg${index}`] = arg;
          });
          flowTracker.trackMethodStart(methodName, className, params);
        } else {
          flowTracker.trackMethodStart(methodName, className);
        }

        // Metodu çalıştır
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        // Metodun bitişini izle
        if (mergedOptions.trackExecutionTime && mergedOptions.trackResult) {
          flowTracker.trackMethodEnd(
            methodName,
            className,
            executionTime,
            result,
          );
        } else if (mergedOptions.trackExecutionTime) {
          flowTracker.trackMethodEnd(methodName, className, executionTime);
        } else if (mergedOptions.trackResult) {
          flowTracker.trackMethodEnd(methodName, className, undefined, result);
        } else {
          flowTracker.trackMethodEnd(methodName, className);
        }

        return result;
      } catch (error) {
        // Hatayı logla
        const executionTime = Date.now() - startTime;
        flowTracker.track(
          `❌ ${methodName} hatası: ${error.message}`,
          className,
        );

        logger.logError(error, contextName, {
          args: mergedOptions.trackParams ? args : 'Not tracked',
        });

        // Hatayı yeniden fırlat
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Bir fonksiyonun parametre isimlerini çıkarır
 * @param func Fonksiyon
 * @returns Parametre isimleri dizisi
 */
function getParamNames(func: Function): string[] {
  const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
  const ARGUMENT_NAMES = /([^\s,]+)/g;

  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  const result = fnStr
    .slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
    .match(ARGUMENT_NAMES);

  return result || [];
}
