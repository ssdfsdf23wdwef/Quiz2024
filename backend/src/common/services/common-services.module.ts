import { Global, Module } from '@nestjs/common';
import { ErrorService } from './error.service';
import { LoggerService } from './logger.service';
import { FlowTrackerService } from './flow-tracker.service';

/**
 * Ortak servisleri içeren modül
 * Bu modül global olarak işaretlenir ve tüm uygulamada kullanılabilir
 */
@Global()
@Module({
  providers: [
    ErrorService,
    FlowTrackerService,
    {
      provide: LoggerService, // LoggerService token'ı
      useFactory: () => LoggerService.getInstance(), // Singleton instance'ı döndüren fabrika
    },
  ],
  exports: [ErrorService, FlowTrackerService, LoggerService], // LoggerService'i export etmeyi unutma
})
export class CommonServicesModule {}
