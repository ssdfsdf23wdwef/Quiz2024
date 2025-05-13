import { SetMetadata } from '@nestjs/common';
import { LoggerService } from '../services/logger.service';

export const CACHE_TTL_KEY = 'cache-ttl';

/**
 * Önbellek süresini belirten decorator
 * Bu decorator ile işaretlenen endpointlerin yanıtları belirtilen süre boyunca önbellekte tutulur
 * @param seconds Önbellek süresi (saniye cinsinden)
 * @returns Decorator
 */
export const CacheTTL = (seconds: number) => {
  const logger = LoggerService.getInstance();
  logger.debug(
    `CacheTTL decorator kullanıldı, süre: ${seconds} saniye`,
    'CacheTTL.decorator',
    __filename,
    15,
    { ttlSeconds: seconds },
  );

  return SetMetadata(CACHE_TTL_KEY, seconds);
};

/**
 * Bir endpoint'in önbellekleme mekanizmasını atlamasını sağlar
 * Bu dekoratör, önbellekleme olsa bile ilgili endpoint'in her zaman yeni veri döndürmesini sağlar
 */
export const NoCache = () => SetMetadata('no_cache', true);
