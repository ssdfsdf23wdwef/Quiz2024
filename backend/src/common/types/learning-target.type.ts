/**
 * Öğrenme hedefi durumu
 */
export enum LearningTargetStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

/**
 * Öğrenme hedefi kaynağı
 */
export enum LearningTargetSource {
  AI_PROPOSAL = 'ai_proposal',
  MANUAL = 'manual',
  DOCUMENT_IMPORT = 'document_import',
}

/**
 * Öğrenme Hedefi (LearningTarget) modelini temsil eden interface
 * @see PRD 7.3
 */
export interface LearningTarget {
  id: string; // Firestore tarafından otomatik atanacak
  userId: string;
  courseId?: string; // Opsiyonel, bir derse bağlıysa
  topicName: string;
  status: LearningTargetStatus;
  isNewTopic: boolean; // Bu hedef bir "yeni konu" ise true
  source: LearningTargetSource; // Hedefin kaynağı
  originalProposedId?: string; // Eğer source === 'ai_proposal', AI'dan gelen geçici ID
  notes?: string; // Kullanıcının ekleyebileceği notlar
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
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
