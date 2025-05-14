/**
 * Öğrenme hedefi durumları - Backend'deki enum ile uyumlu
 */
export enum LearningTargetStatus {
  PENDING = "pending",
  FAILED = "failed",
  MEDIUM = "medium",
  MASTERED = "mastered",
}

// String literal tipini koruyoruz ancak ek olarak enum kullanarak backend uyumluluğunu sağlıyoruz
export type LearningTargetStatusLiteral =
  | "pending"
  | "failed"
  | "medium"
  | "mastered";

/**
 * Tespit edilen alt konu arayüzü
 */
export interface DetectedSubTopic {
  id: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  isSelected?: boolean;
  name?: string;
  status?: LearningTargetStatusLiteral;
  isNew?: boolean;
  isMainTopic?: boolean;     // Ana konu mu alt konu mu
  parentTopic?: string;      // Ana konunun adı (eğer bir alt konu ise)
}

/**
 * Öğrenme hedefi detayları
 */
export interface LearningTarget {
  id: string;
  courseId: string;
  userId: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  status: LearningTargetStatusLiteral;
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastAttemptScorePercent?: number;
  lastAttempt?: string;
  firstEncountered: string;
  lastPersonalizedQuizId?: string;
}

/**
 * Konu tespiti sonuçları
 */
export interface TopicDetectionResult {
  topics: Array<{
    subTopicName: string;
    normalizedSubTopicName: string;
  }>;
}

export interface WeakTopic {
  failCount: number;
  successCount: number;
  lastAttempt: string;
  status: string;
  subTopicId: string;
}

/**
 * Konu tespiti isteği
 */
export interface TopicDetectionRequest {
  documentText: string;
  existingTopics?: string[];
}

/**
 * Öğrenme hedefi oluşturma isteği
 */
export interface CreateLearningTargetRequest {
  courseId: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  status?: LearningTargetStatusLiteral;
}

/**
 * Çoklu öğrenme hedefi oluşturma isteği - Backend DTO formatına uyumlu
 */
export interface BatchCreateLearningTargetsRequest {
  courseId: string;
  topics: Array<{
    subTopicName: string;
    normalizedSubTopicName?: string;
  }>;
}

/**
 * Öğrenme hedefi durumu güncelleme isteği
 */
export interface UpdateLearningTargetStatusRequest {
  targetUpdates: Array<{
    id: string;
    status: LearningTargetStatusLiteral;
    lastAttemptScorePercent: number;
  }>;
}
