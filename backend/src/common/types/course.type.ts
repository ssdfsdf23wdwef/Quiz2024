/**
 * Ders (Course) modelini temsil eden interface
 * @see PRD 7.2
 */
export interface Course {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string; // Consistent with frontend string type
  updatedAt?: string; // Consistent with frontend string type, and added
}

/**
 * Kurs oluşturma DTO
 */
export interface CreateCourseDto {
  name: string;
  description?: string;
}

/**
 * Kurs güncelleme DTO
 */
export interface UpdateCourseDto {
  name?: string;
  description?: string;
}

/**
 * Kurs istatistikleri - Frontend ile uyumlu hale getirildi
 */
export interface CourseStats {
  courseId: string; // Keep courseId for reference if needed
  totalDocuments: number;
  totalQuizzes: number;
  totalLearningTargets: number;
  learningTargetStatusCounts: {
    pending: number;
    failed: number;
    medium: number;
    mastered: number;
  };
  lastQuiz?: {
    id: string;
    timestamp: string; // ISO date string
    score: number;
  };
  averageScore: number;
}

/**
 * Kurs hedef istatistikleri (Bu backend'e özgü kalabilir veya gerekirse ayarlanabilir)
 */
export interface CourseTargetStats {
  courseId: string;
  targetStats: {
    pending: number;
    failed: number;
    medium: number;
    mastered: number;
    total: number;
  };
  quizHistory: Array<{
    id: string;
    date: string; // ISO date string
    score: number;
    quizType: string;
  }>;
  overallStats: {
    totalQuizzes: number;
    averageScore: number;
    masteryPercentage: number;
  };
}

/**
 * Kurs Dashboard Veri Yapısı - Frontend ile uyumlu
 */
export interface CourseDashboardData {
  course: Course;
  stats: CourseStats; // Re-use the aligned CourseStats
  recentQuizzes: Array<{
    id: string;
    quizType: string;
    timestamp: string; // ISO date string
    score: number;
    totalQuestions: number;
  }>;
  learningTargetTrends: Array<{
    date: string; // ISO date string
    pending: number;
    failed: number;
    medium: number;
    mastered: number;
  }>;
  scoreHistory: Array<{
    date: string; // ISO date string
    score: number;
  }>;
}
