import { FlowCategory } from '../services/flow-tracker.service';
import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';
import { safeStringify } from '../utils/logger.utils';

// Logger ve Flow Tracker singleton instance'ları
const logger = LoggerService.getInstance();
const flowTracker = FlowTrackerService.getInstance();

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
    trackReturn?: boolean;
    trackPerformance?: boolean;
  } = {},
) {
  const {
    trackParams = true,
    trackReturn = false,
    trackPerformance = true,
  } = options;

  return function (
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const context = `${className}.${methodName}`;
      const startTime = trackPerformance ? Date.now() : 0;

      try {
        // Safeleştirilmiş argümanlar
        let safeParams;
        if (trackParams) {
          try {
            // Serileştirilebilir objeleri güvenli şekilde dönüştür
            safeParams = args.reduce((params, arg, index) => {
              // HTTP request/response gibi döngüsel yapıları içeren objeleri atla
              if (
                arg &&
                typeof arg === 'object' &&
                (arg.socket || arg.req || arg.headers)
              ) {
                params[`arg${index}`] = '[Circular Object]';
              } else {
                params[`arg${index}`] = arg;
              }
              return params;
            }, {});
          } catch (serializeError) {
            safeParams = { error: 'Serialization Error' };
            logger.warn(
              `Metot argümanları serileştirilemedi: ${serializeError.message}`,
              context,
              __filename,
              '63',
            );
          }
        }

        // Metot başlangıcını kaydet
        flowTracker.trackMethodStart(
          methodName,
          className,
          trackParams ? safeParams : undefined,
        );

        // Metot çalıştırma
        logger.debug(`${methodName} çağrıldı`, context, __filename, '70');
        const result = await originalMethod.apply(this, args);

        // Sonuç kaydı
        const duration = trackPerformance ? Date.now() - startTime : 0;
        let returnValue;

        if (trackReturn) {
          try {
            // Serileştirilebilir sonucu güvenli şekilde dönüştür
            returnValue = safeStringify(result, 500);
          } catch (error) {
            returnValue = 'Serialization Error';
            logger.warn(
              `Metot sonucu serileştirilemedi: ${error.message}`,
              context,
              __filename,
              '85',
            );
          }
        }

        // Metot bitişini kaydet
        flowTracker.trackMethodEnd(
          methodName,
          className,
          duration,
          trackReturn ? returnValue : undefined,
        );

        return result;
      } catch (error) {
        // Hata durumunda loglama
        logger.logError(error, context, __filename, '100', {
          args: trackParams ? safeStringify(args, 200) : 'Not tracked',
        });

        // Hata mesajını izle
        flowTracker.trackError(
          `${methodName} hatası: ${error.message}`,
          className,
        );
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
