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

  // Cookie parser middleware - daha verimli kurulum
  app.use(cookieParser());

  // Ek güvenlik ve performans middleware'leri
  app.use(
    helmet({
      // Bazı helmet ayarlarını devre dışı bırakarak başlangıcı hızlandır
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      dnsPrefetchControl: false,
      frameguard: true,
      hidePoweredBy: true,
      hsts: false,
      ieNoOpen: false,
      noSniff: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: false,
      xssFilter: true,
    }),
  );

  // Sıkıştırma - düşük seviyede başlat, sonra optimize et
  app.use(
    compression({
      level: 1, // Başlangıçta düşük seviye sıkıştırma ile daha hızlı başlatma
      threshold: 1024, // 1KB'dan büyük yanıtları sıkıştır
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanımlanmamış özellikleri otomatik olarak kaldır
      forbidNonWhitelisted: true, // DTO'da tanımlanmamış özellikler için hata döndür
      transform: true, // Parametreleri otomatik olarak DTO tiplerine dönüştür
      transformOptions: {
        enableImplicitConversion: true, // Query parametrelerini otomatik olarak dönüştür
      },
      // Tüm validasyon mesajlarını önbelleğe alarak performans artışı sağlar
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

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

  // Swagger dokümanı - sadece geliştirme ortamında
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
  flowTracker.track(`API başlatıldı: ${appUrl}`, 'Bootstrap');
}

// Uygulamayı başlat ve hataları yakala
void bootstrap().catch((err) => {
  const loggerService = LoggerService.getInstance();
  loggerService.logError(err, 'Bootstrap');

  console.error('Uygulama başlatma hatası:', err.message);
  process.exit(1);
});
