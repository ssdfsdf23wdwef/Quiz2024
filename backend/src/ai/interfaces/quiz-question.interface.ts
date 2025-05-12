import { LoggerService } from '../../common/services/logger.service';

/**
 * Sınav sorusu arayüzü
 */
export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  difficulty: string;
}

/**
 * Sınav oluşturma seçenekleri
 */
export interface QuizGenerationOptions {
  subTopics: string[];
  questionCount: number;
  difficulty?: string;
  prioritizeWeakAndMediumTopics?: boolean;
}

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Quiz Question interfaces yüklendi',
    'quiz-question.interface',
    __filename,
    28,
  );
} catch (error) {
  console.error('Interfaces yüklenirken hata:', error);
}
