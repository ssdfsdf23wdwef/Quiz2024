import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { Request } from 'express';
import { RequestWithUser } from '../../common/interfaces';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { LogMethod } from '../../common/decorators/log-method.decorator';

@Injectable()
export class FirebaseGuard implements CanActivate {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector,
  ) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.logger.debug(
      'FirebaseGuard oluşturuldu',
      'FirebaseGuard.constructor',
      __filename,
      22,
    );
  }

  @LogMethod()
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const httpRequest = context.switchToHttp().getRequest<Request>();
    const authHeader = httpRequest.headers.authorization;
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const path = httpRequest.route?.path || 'bilinmeyen-yol';
    const method = httpRequest.method || 'UNKNOWN';

    this.flowTracker.trackStep(
      `Firebase Guard: ${method} ${path} kimlik doğrulama`,
      'FirebaseGuard',
    );

    if (!authHeader) {
      this.logger.warn(
        'Authorization başlığı eksik',
        'FirebaseGuard.canActivate',
        __filename,
        38,
      );
      throw new UnauthorizedException('Missing authentication token');
    }

    // Extract token from 'Bearer token' format
    const token = authHeader.split(' ')[1];
    if (!token) {
      this.logger.warn(
        'Geçersiz Authorization başlık formatı',
        'FirebaseGuard.canActivate',
        __filename,
        48,
      );
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      this.flowTracker.trackStep(
        'Firebase token doğrulanıyor',
        'FirebaseGuard',
      );
      // Verify the token with Firebase
      const decodedToken = await this.firebaseService.auth.verifyIdToken(
        token,
        true,
      ); // true parametresi token'ın süresi dolmuşsa hata fırlatmasını sağlar
      const uid = decodedToken.uid;

      // Şu anki zaman damgasını al
      const now = Math.floor(Date.now() / 1000);

      // Token'ın süresi dolmuş mu kontrol et
      if (decodedToken.exp && decodedToken.exp < now) {
        this.logger.warn(
          `Token süresi dolmuş: Kullanıcı ${uid}`,
          'FirebaseGuard.canActivate',
          __filename,
          69,
        );
        throw new UnauthorizedException('Authentication token has expired');
      }

      // Firebase'den kullanıcı bilgilerini al
      this.flowTracker.trackStep(
        'Firebase kullanıcı bilgisi alınıyor',
        'FirebaseGuard',
      );
      const firebaseUser = await this.firebaseService.auth.getUser(uid);

      if (!firebaseUser) {
        this.logger.warn(
          `Firebase UID ${uid} ile kullanıcı bulunamadı`,
          'FirebaseGuard.canActivate',
          __filename,
          80,
        );
        throw new UnauthorizedException('User not found in system');
      }

      // Kullanıcı bilgilerini oluştur
      const userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        firstName: firebaseUser.displayName
          ? firebaseUser.displayName.split(' ')[0]
          : '',
        lastName: firebaseUser.displayName
          ? firebaseUser.displayName.split(' ').slice(1).join(' ')
          : '',
        profileImageUrl: firebaseUser.photoURL || null,
        role: decodedToken.role || 'USER', // Token'dan rolleri al veya varsayılan olarak USER kullan
        createdAt: firebaseUser.metadata.creationTime,
        lastLogin: firebaseUser.metadata.lastSignInTime,
        firebaseUser: decodedToken,
      };

      // Attach user object to request for use in controllers
      request.user = userData;
      this.logger.debug(
        `Kullanıcı doğrulandı: ${uid}, rol: ${userData.role}`,
        'FirebaseGuard.canActivate',
        __filename,
        108,
      );

      // Rol kontrolü yap (eğer varsa)
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles && requiredRoles.length > 0) {
        this.flowTracker.trackStep('Rol kontrolü yapılıyor', 'FirebaseGuard');
        const userRole = userData.role;
        if (!requiredRoles.includes(userRole)) {
          this.logger.warn(
            `Kullanıcı ${uid}, rol ${userRole} ile gerekli rollere sahip değil: ${requiredRoles.join(', ')}`,
            'FirebaseGuard.canActivate',
            __filename,
            123,
          );
          throw new ForbiddenException(
            'You do not have permission to access this resource',
          );
        }
        this.logger.debug(
          `Rol kontrolü başarılı: ${userRole}`,
          'FirebaseGuard.canActivate',
          __filename,
          132,
        );
      }

      this.flowTracker.trackStep(
        'Firebase kimlik doğrulama başarılı',
        'FirebaseGuard',
      );
      return true;
    } catch (error) {
      this.logger.logError(error, 'FirebaseGuard.canActivate', {
        path,
        method,
        additionalInfo: 'Firebase kimlik doğrulama hatası',
      });
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}
