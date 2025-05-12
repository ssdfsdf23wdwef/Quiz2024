import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerService } from './common/services/logger.service';
import { FlowTrackerService } from './common/services/flow-tracker.service';
import { LogMethod } from './common/decorators';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  private readonly logger: LoggerService;
  private readonly flowTracker: FlowTrackerService;

  constructor(private readonly appService: AppService) {
    this.logger = LoggerService.getInstance();
    this.flowTracker = FlowTrackerService.getInstance();
  }

  @Get()
  @LogMethod({ trackResult: true })
  getHello(): string {
    this.flowTracker.trackStep('Ana sayfa endpoint çağrıldı', 'AppController');
    return this.appService.getHello();
  }

  @Post()
  @LogMethod()
  getHell(): string {
    this.flowTracker.trackStep('Post endpoint çağrıldı', 'AppController');
    return 'bu post isteği';
  }

  @Get('/hello')
  @LogMethod()
  getH(): string {
    try {
      this.flowTracker.trackStep('Hello endpoint çağrıldı', 'AppController');
      return 'this.appService.getHello()';
    } catch (error) {
      this.logger.logError(error, 'AppController.getH');
      throw error;
    }
  }

  @Public()
  @Get('health')
  @ApiTags('System')
  @ApiOperation({ summary: 'API sağlık durumu kontrol endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API çalışır durumda',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2025-05-07T12:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        message: { type: 'string', example: 'API aktif ve çalışıyor' },
      },
    },
  })
  @LogMethod({ trackResult: true })
  healthCheck() {
    this.flowTracker.trackStep('Sağlık kontrolü yapılıyor', 'AppController');

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: 'API aktif ve çalışıyor',
    };

    this.logger.info(
      'Sağlık kontrolü başarılı',
      'AppController.healthCheck',
      __filename,
      undefined,
      { uptime: process.uptime() },
    );

    return response;
  }
}
