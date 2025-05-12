import { Module, OnModuleInit } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';

@Module({
  imports: [
    FirebaseModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          console.warn('JWT_SECRET bulunamadı, varsayılan değer kullanılıyor');
        }
        return {
          secret:
            secret || process.env.JWT_SECRET || 'bitirme_projesi_gizli_anahtar',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, JwtModule, PassportModule],
})
export class AuthModule implements OnModuleInit {
  constructor(
    private readonly logger: LoggerService,
    private readonly flowTracker: FlowTrackerService,
  ) {}

  onModuleInit() {
    this.logger.info(
      'Auth modülü başlatıldı',
      'AuthModule.onModuleInit',
      __filename,
      48,
    );
    this.flowTracker.trackStep('Auth modülü başlatıldı', 'AuthModule');
  }
}
