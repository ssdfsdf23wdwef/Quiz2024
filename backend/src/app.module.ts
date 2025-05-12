import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FirebaseModule } from './firebase/firebase.module';
import { SharedModule } from './common/shared.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DocumentsModule } from './documents/documents.module';
import { LearningTargetsModule } from './learning-targets/learning-targets.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { AiModule } from './ai/ai.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtAuthGuard } from './auth/guards';
import { Logger } from '@nestjs/common';
import { CommonServicesModule } from './common/services/common-services.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { FlowTrackerService } from './common/services/flow-tracker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DocumentsModule,
    LearningTargetsModule,
    QuizzesModule,
    AiModule,
    SentryModule,
    CacheModule.register(),
    CommonServicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);
  private readonly flowTracker: FlowTrackerService;

  constructor(private readonly configService: ConfigService) {
    this.flowTracker = FlowTrackerService.getInstance();
  }

  onModuleInit() {
    const jwtSecret = this.configService.get('JWT_SECRET');
    this.logger.log(`JWT_SECRET yüklendi mi? ${jwtSecret ? 'Evet' : 'Hayır'}`);

    this.flowTracker.track('Uygulama başlatılıyor...', 'AppModule');
    this.flowTracker.track('Tüm modüller yüklendi', 'AppModule');
    this.flowTracker.track('Uygulama hazır', 'AppModule');

    this.logger.log('Modül başlatma tamamlandı');
  }
}
