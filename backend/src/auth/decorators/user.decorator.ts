import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Autentike olmuş kullanıcı bilgilerini çekmek için decorator
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const logger = LoggerService.getInstance();
    const request = ctx.switchToHttp().getRequest();

    if (!request.user) {
      logger.warn(
        'Kimlik doğrulaması yapılmış kullanıcı bulunamadı. FirebaseGuard çalışıyor mu?',
        'UserDecorator',
        __filename,
      );
      return { uid: 'unknown' };
    }

    logger.debug(
      `Kullanıcı bilgileri alındı: ${request.user.uid}`,
      'UserDecorator',
      __filename,
    );

    // Eğer belirli bir alan istendiyse, sadece o alanı döndür
    if (data) {
      return request.user[data];
    }

    // Tüm kullanıcı nesnesini döndür
    return request.user;
  },
);
