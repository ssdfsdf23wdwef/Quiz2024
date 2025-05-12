/**
 * Ders (Course) modelini temsil eden interface
 * @see PRD 7.2
 */
export interface Course {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
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
 * Kurs istatistikleri
 */
export interface CourseStats {
  courseId: string;
  learningTargets: number;
  quizzes: number;
  failedQuestions: number;
  documents: number;
  total: number;
}

/**
 * Kurs hedef istatistikleri
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
    date: string;
    score: number;
    quizType: string;
  }>;
  overallStats: {
    totalQuizzes: number;
    averageScore: number;
    masteryPercentage: number;
  };
}
