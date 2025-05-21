import { SetMetadata } from '@nestjs/common';
import { LoggerService } from '../../services/logger.service';

/**
 * Public dekoratörü
 *
 * Bu dekoratörle işaretlenen endpoint'ler, JWT kimlik doğrulaması gerektirmez
 * JwtAuthGuard ile birlikte çalışır
 *
 * @example
 * // Login ve register gibi public endpoint'ler
 * @Public()
 * @Post('login')
 * login() { ... }
 *
 * @example
 * // Tüm controller'ı public yapmak için
 * @Public()
 * @Controller('auth')
 * export class AuthController { ... }
 */
export const Public = () => {
  try {
    const logger = LoggerService.getInstance();
    logger.debug(
      'Public decorator kullanıldı',
      'public.decorator',
      __filename,
      24,
    );
  } catch (error) {
    console.error('Public decorator log hatası:', error);
  }
  return SetMetadata('isPublic', true);
};
