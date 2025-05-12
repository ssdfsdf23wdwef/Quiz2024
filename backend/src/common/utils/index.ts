import { LoggerService } from '../services/logger.service';

// Yardımcı fonksiyonları export etme
export * from './password.utils';
export * from './logger.utils';
export * from './firestore.utils';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Utils modülü yüklendi', 'utils.index', __filename, 10);
} catch (error) {
  // Genellikle bu dosya modül yüklenirken çalışır, bu nedenle hataları global olarak yakalayamayız
  console.error('Utils modülü yüklenirken hata:', error);
}
