import { SetMetadata } from '@nestjs/common';
import { LoggerService } from '../services/logger.service';

export const NO_CACHE_KEY = 'no-cache';

/**
 * Önbelleğe almayı devre dışı bırakan decorator
 * Bu decorator ile işaretlenen endpointler cache interceptor tarafından önbelleğe alınmaz
 */
export const NoCache = () => {
  const logger = LoggerService.getInstance();
  logger.debug(
    'NoCache decorator kullanıldı',
    'NoCache.decorator',
    __filename,
    11,
  );

  return SetMetadata(NO_CACHE_KEY, true);
};
