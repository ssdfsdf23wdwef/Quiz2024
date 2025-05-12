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
  providers: [ErrorService, LoggerService, FlowTrackerService],
  exports: [ErrorService, LoggerService, FlowTrackerService],
})
export class CommonServicesModule {}
