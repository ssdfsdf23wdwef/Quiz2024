import { Module } from '@nestjs/common';
import { LoggerService } from '../common/services/logger.service';
import { FlowTrackerService } from '../common/services/flow-tracker.service';
import { NormalizationService } from './normalization/normalization.service';

/**
 * Paylaşılan modül
 * Modüller arasında paylaşılan servisleri ve yardımcıları içerir
 */
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => LoggerService.getInstance(),
    },
    {
      provide: FlowTrackerService,
      useFactory: () => FlowTrackerService.getInstance(),
    },
    NormalizationService,
  ],
  exports: [LoggerService, FlowTrackerService, NormalizationService],
})
export class SharedModule {
  constructor(private readonly logger: LoggerService) {
    this.logger.info(
      'SharedModule başlatıldı',
      'SharedModule.constructor',
      __filename,
      23,
    );
  }
}
