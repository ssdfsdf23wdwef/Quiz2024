import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { LoggerService } from '../../common/services/logger.service';
import { FlowTrackerService } from '../../common/services/flow-tracker.service';
import { LogMethod } from '../../common/decorators/log-method.decorator';

/**
 * JWT kimlik doğrulama stratejisi
 * Token'dan kullanıcı bilgilerini çıkarır ve isteğe ekler
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    // Jwt Secret için tüm olası kaynakları dene
    let jwtSecret = configService.get<string>('JWT_SECRET');

    // ConfigService boş değer döndürürse, doğrudan process.env'den oku
    if (!jwtSecret) {
      jwtSecret = process.env.JWT_SECRET;
      console.warn(
        'ConfigService JWT_SECRET bulamadı, process.env kullanılıyor',
      );
    }

    // Hala bulunamadıysa varsayılan değer kullan ve uyarı log'u oluştur
    if (!jwtSecret) {
      console.warn('JWT_SECRET bulunamadı, varsayılan değer kullanılıyor');
      jwtSecret = 'bitirme_projesi_gizli_anahtar';
    }

    // super çağrısını ilk olarak yapıyoruz (linter hatası nedeniyle)
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Süresi dolmuş token'ları reddet
      secretOrKey: jwtSecret,
    });

    // Servis örneklerini oluştur
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
    this.flowTracker.trackStep('JWT Strategy yapılandırılıyor', 'JwtStrategy');

    this.logger.info(
      `JWT Strategy yapılandırıldı. Secret uzunluğu: ${jwtSecret.length}`,
      'JwtStrategy.constructor',
      __filename,
      54,
    );

    this.logger.info(
      'JWT Strategy başarıyla başlatıldı',
      'JwtStrategy.constructor',
      __filename,
      61,
    );
    this.flowTracker.trackStep('JWT Strategy başlatıldı', 'JwtStrategy');
  }

  /**
   * Token doğrulandıktan sonra çalışan metot
   * Token payload'ından kullanıcıyı bulur
   * İstek nesnesine (req.user) bağlı olarak eklenir
   */
  @LogMethod()
  async validate(payload: { sub: string; email: string }): Promise<any> {
    this.flowTracker.trackStep('Token doğrulanıyor', 'JwtStrategy');
    this.logger.debug(
      `Token doğrulandı, kullanıcı bilgileri alınıyor: ${payload.sub}`,
      'JwtStrategy.validate',
      __filename,
      80,
    );

    try {
      const user = await this.usersService.findByFirebaseUid(payload.sub);

      if (!user) {
        this.logger.warn(
          `Kullanıcı bulunamadı: ${payload.sub}`,
          'JwtStrategy.validate',
          __filename,
          89,
        );
        throw new UnauthorizedException('Kullanıcı bulunamadı veya yetkisiz');
      }

      this.flowTracker.trackStep('Kullanıcı doğrulandı', 'JwtStrategy');
      // Kullanıcı bilgilerini döndür
      // Bu bilgiler, isteğin `user` özelliğine eklenir
      return user;
    } catch (error) {
      this.logger.logError(error, 'JwtStrategy.validate', {
        userId: payload.sub,
        email: payload.email,
        additionalInfo: 'Token doğrulama sırasında hata',
      });
      throw error;
    }
  }
}
