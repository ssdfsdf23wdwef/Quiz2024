import { LoggerService } from './logger.service';

export * from './logger.service';
export * from './flow-tracker.service';
export * from './error.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Services modülü yüklendi', 'services.index', __filename, 9);
} catch (error) {
  // Genellikle bu dosya modül yüklenirken çalışır, bu nedenle hataları global olarak yakalayamayız
  console.error('Services modülü yüklenirken hata:', error);
}
