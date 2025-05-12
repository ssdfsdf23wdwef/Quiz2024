import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache_ttl_seconds';

/**
 * Özel önbellekleme süresi belirleyen dekoratör
 * @param ttlSeconds Önbellekleme süresi (saniye)
 * @example
 * ```typescript
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @CacheTTL(60) // 60 saniye boyunca önbellekle
 *   findAll() {
 *     return this.usersService.findAll();
 *   }
 * }
 * ```
 */
export const CacheTTL = (ttlSeconds: number) =>
  SetMetadata(CACHE_TTL_KEY, ttlSeconds);
