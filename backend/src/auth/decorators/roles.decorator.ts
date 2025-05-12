import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/constants/roles.constants';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Rol tanımlama dekoratörü
 *
 * Bir controller veya handler için gereken rolleri tanımlar.
 * RoleGuard ile birlikte kullanılır.
 *
 * @param roles İzin verilen roller
 * @returns Dekoratör
 *
 * @example
 * // Yalnızca admin rolünün erişebileceği endpoint
 * @Roles(Role.ADMIN)
 * @UseGuards(RoleGuard)
 * @Get('admin-only')
 * getAdminResource() { ... }
 *
 * @example
 * // Admin veya eğitmen rolünün erişebileceği endpoint
 * @Roles(Role.ADMIN, Role.INSTRUCTOR)
 * @UseGuards(RoleGuard)
 * @Get('admin-or-instructor')
 * getAdminOrInstructorResource() { ... }
 */
export const Roles = (...roles: Role[]) => {
  try {
    const logger = LoggerService.getInstance();
    logger.debug(
      `Roles decorator kullanıldı: ${roles.join(', ')}`,
      'roles.decorator',
      __filename,
      30,
    );
  } catch (error) {
    console.error('Roles decorator log hatası:', error);
  }
  return SetMetadata('roles', roles);
};
