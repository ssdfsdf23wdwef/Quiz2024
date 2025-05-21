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
import {
  CORS_WHITELIST,
  HELMET_CONFIG,
  COMPRESSION_CONFIG,
  VALIDATION_PIPE_CONFIG,
  GLOBAL_PREFIX,
  DEFAULT_PORT,
} from './common/constants';

async function bootstrap() {
  // Log klasörünü oluştur
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Performans ölçümü başlat
  const startTime = performance.now();
  console.log('🚀 Backend başlatılıyor...');

  // Optimize edilmiş NestJS uygulaması oluşturma
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn', 'log']
        : ['error', 'warn'],
    bufferLogs: true, // Başlangıçta log buffering ile daha hızlı başlatma
    abortOnError: false, // Hatalarda durdurmayıp devam et
    bodyParser: true, // Body parser etkinleştir (varsayılan)
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
        ...CORS_WHITELIST,
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

  // Cookie parser middleware - daha verimli kurulum
  app.use(cookieParser());

  // Ek güvenlik ve performans middleware'leri
  app.use(helmet(HELMET_CONFIG));

  // Sıkıştırma - düşük seviyede başlat, sonra optimize et
  app.use(compression(COMPRESSION_CONFIG));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe(VALIDATION_PIPE_CONFIG));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Health check endpoint
  app.use(`/${GLOBAL_PREFIX}/health`, (req, res) => {
    flowTracker.track('Health check isteği alındı', 'Bootstrap');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  });

  // Global prefix
  const globalPrefix = configService.get('API_PREFIX', GLOBAL_PREFIX);
  app.setGlobalPrefix(globalPrefix);

  // Swagger dokümanı - sadece geliştirme ortamında
  if (configService.get('NODE_ENV') !== 'production') {
    try {
      setupSwagger(app);
      flowTracker.track(
        `Swagger dokümantasyonu etkinleştirildi: /${globalPrefix}/docs`,
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
  const port = configService.get('PORT', DEFAULT_PORT);
  await app.listen(port);

  const appUrl = await app.getUrl();

  // Başlangıç süresini hesapla ve logla
  const endTime = performance.now();
  const startupTime = (endTime - startTime).toFixed(2);

  console.log(`
✅ Backend ${startupTime}ms içinde başarıyla başlatıldı!
🌐 API Endpoint: ${appUrl}
🔑 Environment: ${process.env.NODE_ENV || 'development'}
🚪 Port: ${port}
📄 API Docs: ${appUrl}/docs (geliştirme modunda)
💻 Node.js: ${process.version}
💭 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB kullanılıyor
  `);

  logger.log(`Uygulama başlatıldı: ${appUrl}`);
  loggerService.info(
    `Uygulama başlatıldı: ${appUrl} (${startupTime}ms)`,
    'Bootstrap',
    __filename,
  );
}

bootstrap().catch((error) => {
  const loggerService = LoggerService.getInstance();
  loggerService.logError(error, 'Bootstrap.Catch');
  process.exit(1); // Hata durumunda çıkış yap
});
