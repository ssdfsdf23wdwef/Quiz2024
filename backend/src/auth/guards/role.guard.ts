import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLE_PERMISSIONS } from '../../common/constants/roles.constants';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { LogMethod } from '../../common/decorators/log-method.decorator';

/**
 * Rol bazlı yetkilendirme guard'ı
 * Controller veya handler'lar üzerinde @Roles() dekoratörü ile kullanılır
 *
 * Örnek kullanım:
 * ```
 * @Roles(Role.ADMIN, Role.INSTRUCTOR)
 * @UseGuards(RoleGuard)
 * @Get('protected-resource')
 * getProtectedResource() { ... }
 * ```
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private reflector: Reflector) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'RoleGuard oluşturuldu',
      'RoleGuard.constructor',
      __filename,
      26,
    );
  }

  @LogMethod()
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.route?.path || 'bilinmeyen-yol';
    const method = request.method || 'UNKNOWN';

    this.flowTracker.trackStep(
      `Role Guard: ${method} ${path} yetki kontrolü`,
      'RoleGuard',
    );

    // Handler ve class üzerindeki gerekli rolleri al
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Eğer rol gerekliliği yoksa, erişime izin ver
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.debug(
        `Rol gerekliliği yok: ${method} ${path}`,
        'RoleGuard.canActivate',
        __filename,
        48,
      );
      this.flowTracker.trackStep(
        'Rol kontrolü atlandı - gereklilik yok',
        'RoleGuard',
      );
      return true;
    }

    // HTTP isteğinden kullanıcı nesnesini al
    const user = request.user;

    // Kullanıcı nesnesi yoksa, yetkilendirme başarısız
    if (!user) {
      this.logger.warn(
        `Kullanıcı bulunamadı, erişim reddedildi: ${method} ${path}`,
        'RoleGuard.canActivate',
        __filename,
        60,
      );
      this.flowTracker.trackStep(
        'Rol kontrolü başarısız - kullanıcı yok',
        'RoleGuard',
      );
      return false;
    }

    // Kullanıcının rolünü kontrol et
    if (!user.role) {
      this.logger.warn(
        `Kullanıcı rolü yok, erişim reddedildi: ${user.id}, ${method} ${path}`,
        'RoleGuard.canActivate',
        __filename,
        70,
      );
      this.flowTracker.trackStep(
        'Rol kontrolü başarısız - rol tanımlanmamış',
        'RoleGuard',
      );
      return false;
    }

    // Kullanıcının yetki seviyesini hesapla
    const userPermissionLevel = ROLE_PERMISSIONS[user.role] || 0;
    const requiredRolesStr = requiredRoles.join(', ');

    // Gerekli rollerden birinin yetki seviyesine eşit veya daha yüksek yetki seviyesine sahipse erişime izin ver
    const hasAccess = requiredRoles.some((role) => {
      const requiredPermissionLevel = ROLE_PERMISSIONS[role] || 0;
      return userPermissionLevel >= requiredPermissionLevel;
    });

    if (hasAccess) {
      this.logger.debug(
        `Rol kontrolü başarılı: ${user.role} rolü, gereken: ${requiredRolesStr}, ${method} ${path}`,
        'RoleGuard.canActivate',
        __filename,
        88,
      );
      this.flowTracker.trackStep(
        'Rol kontrolü başarılı - erişim izni verildi',
        'RoleGuard',
      );
    } else {
      this.logger.warn(
        `Yetersiz yetki: ${user.role} rolü, gereken: ${requiredRolesStr}, ${method} ${path}`,
        'RoleGuard.canActivate',
        __filename,
        95,
      );
      this.flowTracker.trackStep(
        'Rol kontrolü başarısız - yetersiz yetki',
        'RoleGuard',
      );
    }

    return hasAccess;
  }
}
