import { LoggerService } from '../../common/services/logger.service';

export * from './topic-detection.interface';
export * from './quiz-question.interface';

// Eski arayüz tanımlamaları kaldırıldı, quiz-question.interface.ts dosyasındaki tanımlar kullanılacak

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'AI interfaces index yüklendi',
    'ai.interfaces.index',
    __filename,
    9,
  );
} catch (error) {
  console.error('Interface index yüklenirken hata:', error);
}
