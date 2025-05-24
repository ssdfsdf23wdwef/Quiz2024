/**
 * Öğrenme Hedefi (LearningTarget) modelini temsil eden interface
 * @see PRD 7.3
 */
export interface LearningTarget {
  id: string;
  courseId: string;
  userId: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  status: 'pending' | 'failed' | 'medium' | 'mastered';
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastAttemptScorePercent: number | null;
  lastAttempt: string | null;
  firstEncountered: string;
  updatedAt?: string | null;
  source?: 'user_created' | 'document_extracted' | 'ai_generated_new' | 'legacy';
}

/**
 * Öğrenme hedefi oluşturma DTO
 */
export interface CreateLearningTargetDto {
  courseId: string;
  subTopicName: string;
  normalizedSubTopicName?: string;
  status?: 'pending' | 'failed' | 'medium' | 'mastered';
  source?: 'user_created' | 'document_extracted' | 'ai_generated_new' | 'legacy';
}

/**
 * Öğrenme hedefi güncelleme DTO
 */
export interface UpdateLearningTargetDto {
  status?: 'pending' | 'failed' | 'medium' | 'mastered';
  failCount?: number;
  mediumCount?: number;
  successCount?: number;
  lastAttemptScorePercent?: number | null;
  lastAttempt?: string | null;
}

/**
 * Quiz verilerine sahip öğrenme hedefi
 */
export interface LearningTargetWithQuizzes extends LearningTarget {
  quizzes?: Array<{
    id: string;
    type: string;
    completedAt: Date;
    questions: Array<{
      subTopicName: string;
      scorePercent: number;
    }>;
  }>;
  lastPersonalizedQuizId?: string | null;
}

/**
 * Öğrenme hedefi durumu güncellemesi
 */
export interface LearningTargetStatusUpdate {
  id: string;
  status: 'pending' | 'failed' | 'medium' | 'mastered';
  scorePercent: number;
  quizId?: string;
}
