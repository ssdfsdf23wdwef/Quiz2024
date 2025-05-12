import { Module } from '@nestjs/common';
import { CommonServicesModule } from './services/common-services.module';
import { LoggerService } from './services/logger.service';
import { FlowTrackerService } from './services/flow-tracker.service';

/**
 * Paylaşılan modüller (Shared Module)
 * Bu modül, uygulama genelinde kullanılan ortak servisleri ve utilities'leri sağlar
 */
@Module({
  imports: [CommonServicesModule],
  exports: [CommonServicesModule],
  providers: [
    {
      provide: LoggerService,
      useFactory: () => LoggerService.getInstance(),
    },
    {
      provide: FlowTrackerService,
      useFactory: () => FlowTrackerService.getInstance(),
    },
  ],
})
export class SharedModule {
  constructor(private readonly logger: LoggerService) {
    this.logger.info(
      'SharedModule başlatıldı',
      'SharedModule.constructor',
      __filename,
      13,
    );
  }
}
