/**
 * Kullanıcı (User) modelini temsil eden interface
 * @see PRD 7.1
 */
export interface User {
  id: string;
  uid: string;
  firebaseUid: string; // Firebase kullanıcı ID'si (auth.service.ts için gerekli)
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  role?: 'USER' | 'ADMIN';
  onboarded?: boolean;
  createdAt: Date;
  updatedAt: Date; // Güncellenme tarihi
  lastLogin: Date;
  settings?: Record<string, any>;
}

/**
 * Kullanıcı güncelleme DTO
 */
export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  onboarded?: boolean;
}

/**
 * Tema tipi
 * @see ThemeType enum
 */
export type UserTheme = 'light' | 'dark' | 'system';

/**
 * Kullanıcı istatistikleri
 */
export interface UserStats {
  completedQuizzes: number;
  averageScore: number;
  totalCourses: number;
  lastActive?: string; // ISO date string
}

/**
 * Kullanıcı tercihleri
 */
export interface UserPreferences {
  theme: UserTheme;
  notifications: boolean;
  language: string;
}

/**
 * Konu bazlı kullanıcı ilerleme durumu
 */
export interface TopicProgress {
  subTopic: string;
  normalizedSubTopic: string;
  status: 'weak' | 'medium' | 'strong';
  scorePercent: number;
  questionCount: number;
  lastAttempt: string;
}

/**
 * Zorluk seviyesi bazlı kullanıcı ilerleme durumu
 */
export interface DifficultyProgress {
  difficulty: 'easy' | 'medium' | 'hard';
  scorePercent: number;
  questionCount: number;
  correctCount: number;
}

/**
 * Kullanıcı sınav ilerleme
 */
export interface UserQuizProgress {
  totalQuizzes: number;
  averageScore: number;
  quizzesLast30Days: number;
  scorePercentLast30Days: number;
  quizzesByType: Record<string, number>;
  recentQuizzes: Array<{
    id: string;
    date: string;
    score: number;
    quizType: string;
  }>;
}

/**
 * Kullanıcı ilerleme durumu
 */
export interface UserProgress {
  userId: string;
  totalStudyTime: number;
  studyTimeLast30Days: number;
  totalQuestionsAnswered: number;
  overallCorrectRate: number;
  topicProgress: TopicProgress[];
  difficultyProgress: DifficultyProgress[];
  strongestTopics: TopicProgress[];
  weakestTopics: TopicProgress[];
  quizProgress: UserQuizProgress;
  recommendations: string[];
}
