import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
// Cache modülleri yüklendikten sonra bu yorum satırları silinebilir
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';

/**
 * Gelişmiş önbellekleme desteği sağlayan interceptor
 * Bu interceptor, CacheModule ile birlikte kullanılır ve belirli endpoint cevaplarını
 * önbelleğe almak için kullanılabilir
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly defaultTtl: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    // Default TTL in milliseconds
    this.defaultTtl =
      this.configService.get<number>('CACHE_TTL_SECONDS', 300) * 1000;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Only cache GET requests
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check if endpoint is marked with @NoCache()
    const shouldSkipCache = this.reflector.get<boolean>(
      'no_cache',
      context.getHandler(),
    );

    if (shouldSkipCache) {
      this.logger.debug(`Cache atlanıyor: ${request.url} (NoCache)`);
      return next.handle();
    }

    // Exclude endpoints with query params that should not be cached (e.g., pagination)
    const excludeParams = ['page', 'limit', 'random'];
    const shouldSkipDueToParams = Object.keys(request.query).some((param) =>
      excludeParams.includes(param),
    );

    if (shouldSkipDueToParams) {
      this.logger.debug(`Cache atlanıyor: ${request.url} (Params)`);
      return next.handle();
    }

    // Create a cache key from the request
    const cacheKey = this.generateCacheKey(request);

    try {
      // Get custom TTL if set with @CacheTTL decorator
      const customTtl = this.reflector.get<number>(
        'cache_ttl',
        context.getHandler(),
      );

      const ttl = customTtl ? customTtl * 1000 : this.defaultTtl;

      // Try to get from cache
      const cachedResponse = await this.cacheManager.get(cacheKey);

      if (cachedResponse) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return of(cachedResponse);
      }

      // If not in cache, execute the handler and store the result
      this.logger.debug(`Cache miss: ${cacheKey}`);
      return next.handle().pipe(
        tap((response) => {
          if (response) {
            // Promise handling başarılı-başarısız durumlarını burada yönetiyoruz
            this.cacheManager
              .set(cacheKey, response, { ttl: ttl })
              .then(() => {
                this.logger.debug(
                  `Önbelleğe alındı: ${cacheKey} (TTL: ${ttl / 1000}s)`,
                );
              })
              .catch((error) => {
                // Ensure error is treated as a string for logging
                const errorMsg =
                  error instanceof Error ? error.message : String(error);
                this.logger.error(`Önbelleğe alma başarısız: ${errorMsg}`);
              });
          }
        }),
      );
    } catch (error) {
      // Ensure error is treated as a string for logging
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Önbellek hatası: ${errorMsg}`);
      return next.handle();
    }
  }

  /**
   * Generate a unique cache key based on request
   */
  private generateCacheKey(request: Request): string {
    const { originalUrl, query, params } = request;

    // Include user ID in cache key if authenticated
    // Firebase auth ile gelen kullanıcı bilgisini any olarak alıyoruz
    const userId = (request as any).user?.uid || 'anonymous';

    // Combine URL, sorted query params, and user ID into a unique key
    return `${userId}:${originalUrl}:${JSON.stringify(
      this.sortObject({ ...query, ...params }),
    )}`;
  }

  /**
   * Sort object keys for consistent cache key generation
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = obj[key];
          return result;
        },
        {} as Record<string, any>,
      );
  }
}
