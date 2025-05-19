import { LoggerService } from '../../common/services/logger.service';

export * from './topic-detection.interface';
export * from './quiz-question.interface';

/**
 * Metadata for quiz generation operations
 */
export interface QuizMetadata {
  traceId: string;
  userId?: string;
  courseName?: string;
  subTopicsCount?: number;
  questionCount?: number;
  difficulty?: string;
  subTopics?: string[]; // Alt konular listesi
  documentId?: string; // Belge ID
  keywords?: string; // Anahtar kelimeler
  specialTopic?: string; // Özel konu tipi (eksaskala, programlama, vb.)
}

/**
 * Quiz oluşturma seçenekleri
 */
export interface QuizGenerationOptions {
  documentText?: string;
  subTopics: string[];
  questionCount: number;
  difficulty: string;
  personalizationContext?: string;
  documentId?: string; // Belge ID
}

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
