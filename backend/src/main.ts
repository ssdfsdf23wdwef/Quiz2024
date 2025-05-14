import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from '@nestjs/common';
import { setupSwagger } from './common/documentation/swagger.config';
import { LoggerService } from './common/services/logger.service';
import { FlowTrackerService } from './common/services/flow-tracker.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Log klasörünü oluştur
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'], // Development ortamında tüm log seviyelerini etkinleştir
  });

  // Config service
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Servislerimizi başlat - singleton pattern kullanıyorlar
  const loggerService = LoggerService.getInstance();
  const flowTracker = FlowTrackerService.getInstance();

  flowTracker.track('Uygulama başlatılıyor', 'Bootstrap');

  // CORS ayarları - Frontend ile iletişim için daha açık yapılandırma
  app.enableCors({
    origin: (origin, callback) => {
      // Geliştirme ortamında daha geniş izin ver
      const whitelist = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:4000',
        'http://localhost:5000',
        'http://localhost:3002',
        'http://localhost:8000',
        'http://localhost',
        'http://127.0.0.1',
        'capacitor://localhost',
        configService.get('CORS_ORIGIN'),
      ].filter(Boolean);

      // Localhost üzerinden gelen tüm isteklere izin ver
      if (
        !origin ||
        whitelist.indexOf(origin) !== -1 ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1')
      ) {
        callback(null, true);
      } else {
        const msg = `CORS politikası bu kaynağa erişimi reddetti: ${origin}`;
        loggerService.warn(msg, 'CORS.check', __filename);
        callback(new Error(msg), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Access-Token',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600, // 1 saat önbellek
  });

  flowTracker.track('CORS ayarları yapılandırıldı', 'Bootstrap');

  // Cookie parser middleware
  app.use(cookieParser());

  // Ek güvenlik ve performans middleware'leri
  app.use(helmet());
  app.use(compression());

  flowTracker.track("Middleware'ler yapılandırıldı", 'Bootstrap');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlanmamış özellikleri otomatik olarak kaldır
      forbidNonWhitelisted: true, // DTO'da tanımlanmamış özellikler için hata döndür
      transform: true, // Parametreleri otomatik olarak DTO tiplerine dönüştür
      transformOptions: {
        enableImplicitConversion: true, // Query parametrelerini otomatik olarak dönüştür
      },
    }),
  );

  flowTracker.track('Validation pipe yapılandırıldı', 'Bootstrap');

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  flowTracker.track('Exception filter yapılandırıldı', 'Bootstrap');

  // Health check endpoint
  app.use('/api/health', (req, res) => {
    flowTracker.track('Health check isteği alındı', 'Bootstrap');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });

  // Global prefix
  const globalPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(globalPrefix);

  flowTracker.track(`Global prefix ayarlandı: ${globalPrefix}`, 'Bootstrap');

  // Swagger dokümanı - geliştirme ortamında
  if (configService.get('NODE_ENV') !== 'production') {
    try {
      setupSwagger(app);
      flowTracker.track(
        'Swagger dokümantasyonu etkinleştirildi: /api/docs',
        'Bootstrap',
      );
    } catch (error) {
      flowTracker.track(
        `Swagger dokümantasyonu etkinleştirilemedi: ${error.message}`,
        'Bootstrap',
      );
      loggerService.logError(error, 'Bootstrap.setupSwagger');
    }
  }

  // Uygulama kapatıldığında temizlik işlemleri
  app.enableShutdownHooks();

  // Uygulamayı dinlemeye başla
  const port = configService.get('PORT', 3001);
  await app.listen(port);

  const appUrl = await app.getUrl();
  flowTracker.track(
    `Uygulama ${appUrl}/${globalPrefix} adresinde çalışıyor`,
    'Bootstrap',
  );
  flowTracker.track(
    `Çalışma ortamı: ${process.env.NODE_ENV || 'development'}`,
    'Bootstrap',
  );

  // Uygulama başlangıç bilgilerini logla
  loggerService.info(
    'Uygulama başlatıldı',
    'Bootstrap',
    __filename,
    undefined,
    {
      port,
      env: process.env.NODE_ENV || 'development',
      url: `${appUrl}/${globalPrefix}`,
    },
  );
}

// Uygulamayı başlat ve hataları yakala
void bootstrap().catch((err) => {
  const loggerService = LoggerService.getInstance();
  loggerService.logError(err, 'Bootstrap');

  console.error('Uygulama başlatma hatası:', err.message);
  process.exit(1);
});
