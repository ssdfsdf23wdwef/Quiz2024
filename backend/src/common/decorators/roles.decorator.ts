import { SetMetadata } from '@nestjs/common';
import { LoggerService } from '../services/logger.service';

export const ROLES_KEY = 'roles';

/**
 * Rolü kontrol eden decorator
 * Bu decorator, belirli bir endpointe erişim için gerekli rolleri belirtir
 * @param roles İzin verilen roller
 * @returns Decorator
 */
export const Roles = (...roles: string[]) => {
  const logger = LoggerService.getInstance();
  logger.debug(
    `Roles decorator kullanıldı, roles: [${roles.join(', ')}]`,
    'Roles.decorator',
    __filename,
    14,
    { roles },
  );

  return SetMetadata(ROLES_KEY, roles);
};
