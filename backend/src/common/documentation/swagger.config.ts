import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerService } from '../services/logger.service';
import { FlowTrackerService } from '../services/flow-tracker.service';

/**
 * Swagger belgelendirmesini yapılandırır
 * @param app NestJS uygulaması
 */
export function setupSwagger(app: INestApplication): void {
  const logger = LoggerService.getInstance();
  const flowTracker = FlowTrackerService.getInstance();

  try {
    flowTracker.trackStep(
      'Swagger belgelendirmesi yapılandırılıyor',
      'swagger.config',
    );

    const config = new DocumentBuilder()
      .setTitle('Eğitim API')
      .setDescription('Eğitim platformu için API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, document);

    flowTracker.trackStep(
      'Swagger belgelendirmesi başarıyla yapılandırıldı',
      'swagger.config',
    );
    logger.info(
      'Swagger belgelendirmesi başarıyla yapılandırıldı',
      'swagger.config.setupSwagger',
      __filename,
      16,
    );
  } catch (error) {
    logger.logError(error, 'swagger.config.setupSwagger', {
      additionalInfo: 'Swagger yapılandırması sırasında hata oluştu',
    });
    throw error;
  }
}
