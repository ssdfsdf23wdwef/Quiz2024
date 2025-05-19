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
 * Alt konu tipi
 */
export type SubTopicType =
  | string[]
  | { subTopicName: string; count: number; status?: string }[];

/**
 * Sınav oluşturma seçenekleri
 */
export interface QuizGenerationOptions {
  subTopics: SubTopicType;
  questionCount: number;
  difficulty?: string;
  prioritizeWeakAndMediumTopics?: boolean;
  documentText?: string; // Belge metni
  personalizationContext?: string; // Kişiselleştirme için ek bağlam bilgisi
  quizType?: 'quick' | 'personalized'; // Sınav tipi
  courseId?: string | null; // Kurs ID (personalized için)
  personalizedQuizType?: string | null; // Kişiselleştirilmiş sınav alt tipi
  userId?: string; // Kullanıcı ID'si (loglama için)
  documentId?: string; // Belge ID (referans için)
  traceId?: string; // Trace ID (takip için)
}

/**
 * Quiz metadata ara interface'i
 */
export interface QuizMetadata {
  traceId: string;
  subTopicsCount?: number;
  difficulty?: string;
  questionCount?: number;
  userId?: string;
  documentId?: string;
  keywords?: string;
  specialTopic?: string;
  subTopics?: SubTopicType;
  documentText?: string;
  personalizationContext?: string;
  courseId?: string | null;
  personalizedQuizType?: string | null;
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
