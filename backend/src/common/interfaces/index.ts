import { LoggerService } from '../services/logger.service';

export * from './request-with-user.interface';

/**
 * Kullanıcı (User) modelini temsil eden interface
 * @see PRD 7.1
 */
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
  settings?: Record<string, any>;
}

/**
 * Ders (Course) modelini temsil eden interface (PRD 7.2)
 */
export interface Course {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date | string;
}

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
}

/**
 * Sınav (Quiz) modelini temsil eden interface
 * @see PRD 7.4
 */
export interface Quiz {
  id: string;
  userId: string;
  courseId?: string;
  quizType: string;
  personalizedQuizType: string | null;
  sourceDocument?: any;
  selectedSubTopics?: any;
  preferences: any;
  questions: any[];
  userAnswers: Record<string, string>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedTime?: number;
  analysisResult?: any;
  timestamp: Date;
}

export interface QuizPreferences {
  questionCount: number;
  difficulty: string;
  timeLimit?: number | null;
  prioritizeWeakAndMediumTopics?: boolean | null;
}

/**
 * Soru (Question) modelini temsil eden interface
 * @see PRD 7.5
 */
export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: string;
}

/**
 * Sınav Analiz Sonucu (AnalysisResult)
 * @see PRD 7.6
 */
export interface AnalysisResult {
  overallScore: number;
  performanceBySubTopic: Record<
    string,
    {
      scorePercent: number;
      status: 'pending' | 'failed' | 'medium' | 'mastered';
      questionCount: number;
      correctCount: number;
    }
  >;
  performanceCategorization: {
    failed: string[];
    medium: string[];
    mastered: string[];
  };
  performanceByDifficulty: Record<
    string,
    {
      count: number;
      correct: number;
      score: number;
    }
  >;
  recommendations?: string[] | null;
}

/**
 * Başarısız Soru (FailedQuestion) modelini temsil eden interface
 * @see PRD 7.7
 */
export interface FailedQuestion {
  id: string;
  userId: string;
  quizId: string;
  questionId: string;
  courseId?: string | null;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  subTopicName: string;
  normalizedSubTopicName: string;
  difficulty: string;
  failedTimestamp: string;
}

/**
 * Belge (Document) modelini temsil eden interface
 * @see PRD 7.8
 */
export interface Document {
  id: string;
  userId: string;
  courseId?: string | null;
  fileName: string;
  storagePath: string;
  storageUrl: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  createdAt: string;
}

/**
 * Belge (Document) listeleme için minimal alanlar
 */
export interface DocumentListItem {
  id: string;
  fileName: string;
  storagePath: string;
  storageUrl: string;
  fileType: string;
  fileSize: number;
  courseId?: string | null;
  createdAt: string;
}

export interface RequestWithUser {
  user: {
    id: string;
    uid: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string | null;
    role?: string;
    createdAt?: string | Date;
    lastLogin?: string | Date;
    firebaseUser?: any;
  };
}

export interface LearningTargetWithQuizzes {
  id: string;
  userId: string;
  courseId: string;
  status: 'pending' | 'failed' | 'medium' | 'mastered';
  lastAttempt: Date | null;
  lastAttemptScorePercent: number | null;
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastPersonalizedQuizId?: string | null;
  subTopicName: string;
  normalizedSubTopicName: string;
  firstEncountered: Date;
  updatedAt?: Date | null;
  quizzes?: Array<{
    id: string;
    type: string;
    completedAt: Date;
    questions: Array<{
      subTopicName: string;
      scorePercent: number;
    }>;
  }>;
}

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Interface indeksi yüklendi', 'interfaces.index', __filename, 8);
} catch (error) {
  // Genellikle bu dosya modül yüklenirken çalışır, bu nedenle hataları global olarak yakalayamayız
  console.error('Interface indeksi yüklenirken hata:', error);
}
