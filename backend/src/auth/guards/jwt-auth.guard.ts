import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { LogMethod } from '../../common/decorators/log-method.decorator';

/**
 * JWT tabanlı kimlik doğrulama guard'ı
 * Bu guard, @Public dekoratörü veya @SetMetadata('anonymousAllowed', true) ile işaretlenmiş
 * tüm endpoint'lere anonim erişime izin verir
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private reflector: Reflector) {
    super();
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'JwtAuthGuard oluşturuldu',
      'JwtAuthGuard.constructor',
      __filename,
      22,
    );
  }

  @LogMethod()
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route?.path || 'bilinmeyen-yol';
    const method = request.method || 'UNKNOWN';

    this.flowTracker.trackStep(
      `JWT Guard: ${method} ${path} erişim kontrolü`,
      'JwtAuthGuard',
    );

    // Public olarak işaretlenmiş endpoint'lere erişim serbest
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Anonim erişime izin verilen endpoint'ler kontrolü
    const isAnonymousAllowed = this.reflector.getAllAndOverride<boolean>(
      'anonymousAllowed',
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isAnonymousAllowed) {
      this.logger.debug(
        `Anonim erişim izni verilen endpoint: ${method} ${path} (isPublic: ${isPublic}, isAnonymousAllowed: ${isAnonymousAllowed})`,
        'JwtAuthGuard.canActivate',
        __filename,
        52,
      );
      this.flowTracker.trackStep(
        'Endpoint anonim erişime açık, kimlik doğrulama atlanıyor',
        'JwtAuthGuard',
      );
      return true;
    }

    // Diğer tüm endpoint'ler için JWT kimlik doğrulaması gerekli
    this.logger.debug(
      `Korumalı endpoint: ${method} ${path}`,
      'JwtAuthGuard.canActivate',
      __filename,
      63,
    );
    this.flowTracker.trackStep(
      'JWT doğrulama gerçekleştiriliyor',
      'JwtAuthGuard',
    );
    return super.canActivate(context);
  }
}
