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
  questionType: string; // 'multiple_choice' | 'true_false' | 'fill_in_blank' | 'short_answer'
  cognitiveDomain: string; // 'remembering' | 'understanding' | 'applying' | 'analyzing' | 'evaluating' | 'creating'
}

/**
 * Sınav oluşturma seçenekleri
 */
export interface QuizGenerationOptions {
  subTopics:
    | string[]
    | { subTopicName: string; count: number; status?: string }[];
  questionCount: number;
  difficulty?: string;
  prioritizeWeakAndMediumTopics?: boolean;
}

/**
 * Quiz metadata ara interface'i
 */
export interface QuizMetadata {
  traceId: string;
  subTopicsCount?: number;
  difficulty?: string;
  questionCount?: number;
}

// Hata paketleyici
export interface ErrorWithMetadata extends Error {
  metadata?: Record<string, any>;
}

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Quiz Question interfaces yüklendi', 'quiz-question.interface');
} catch (error) {
  console.error('Interfaces yüklenirken hata:', error);
}
