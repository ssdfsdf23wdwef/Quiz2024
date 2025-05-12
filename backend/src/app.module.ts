import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DocumentsModule } from './documents/documents.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { LearningTargetsModule } from './learning-targets/learning-targets.module';
import { FirebaseModule } from './firebase/firebase.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { CommonServicesModule } from './common/services/common-services.module';
import { SharedModule as CommonSharedModule } from './common/shared.module';
import { SharedModule } from './shared/shared.module';
import { AiModule } from './ai/ai.module';
import { LoggerService } from './common/services/logger.service';
import { FlowTrackerService } from './common/services/flow-tracker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    DocumentsModule,
    QuizzesModule,
    LearningTargetsModule,
    FirebaseModule,
    CommonServicesModule,
    CommonSharedModule,
    SharedModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: LoggerService,
      useFactory: () => LoggerService.getInstance(),
    },
    {
      provide: FlowTrackerService,
      useFactory: () => FlowTrackerService.getInstance(),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {
  constructor(private readonly configService: ConfigService) {
    const logger = LoggerService.getInstance();
    logger.info(
      `JWT_SECRET yüklendi mi? ${configService.get('JWT_SECRET') ? 'Evet' : 'Hayır'}`,
      'AppModule',
      __filename,
    );
    FlowTrackerService.getInstance().track(
      'Uygulama başlatılıyor...',
      'AppModule',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    FlowTrackerService.getInstance().track(
      'Tüm modüller yüklendi',
      'AppModule',
    );
  }

  onModuleInit() {
    FlowTrackerService.getInstance().track('Uygulama hazır', 'AppModule');
    LoggerService.getInstance().info(
      'Modül başlatma tamamlandı',
      'AppModule',
      __filename,
    );
  }
}
