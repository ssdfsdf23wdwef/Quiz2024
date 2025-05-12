import { Injectable } from '@nestjs/common';
import { LoggerService } from './common/services/logger.service';
import { FlowTrackerService } from './common/services/flow-tracker.service';
import { LogMethod } from './common/decorators';

@Injectable()
export class AppService {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor() {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  @LogMethod({ trackResult: true })
  getHello(): string {
    this.flowTracker.trackStep('getHello metodu çalıştırılıyor', 'AppService');

    try {
      // Basit bir örnek işlem
      const result = 'Hello World!';

      this.logger.info(
        'getHello metodu başarıyla tamamlandı',
        'AppService.getHello',
        __filename,
        undefined,
      );

      return result;
    } catch (error) {
      this.logger.logError(error, 'AppService.getHello', {
        additionalContext: 'Temel servis işlemi sırasında hata',
      });
      throw error;
    }
  }
}
