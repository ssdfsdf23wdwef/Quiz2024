import { LearningTarget } from "./learningTarget.type";
import { DocumentType } from "./document.type";
import { Quiz } from "./quiz.type";

/**
 * Ders (Course) temel modeli
 */
export interface Course {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

/**
 * Ders istatistikleri
 */
export interface CourseStats {
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
    timestamp: string;
    score: number;
  };
  averageScore: number;
}

/**
 * Ders dashboard veri yapısı
 */
export interface CourseDashboard {
  course: Course;
  stats: CourseStats;
  recentQuizzes: Array<{
    id: string;
    quizType: string;
    timestamp: string;
    score: number;
    totalQuestions: number;
  }>;
  learningTargetTrends: Array<{
    date: string;
    pending: number;
    failed: number;
    medium: number;
    mastered: number;
  }>;
  scoreHistory: Array<{
    date: string;
    score: number;
  }>;
}

/**
 * Derse ilişkin tüm öğeler
 */
export interface CourseRelatedItems {
  documents: DocumentType[];
  learningTargets: LearningTarget[];
  quizzes: Quiz[];
}

/**
 * Ders durumunu temsil eden tip (PRD'de belirtildiği gibi)
 */
export type CourseProgressStatus = "notStarted" | "inProgress" | "completed";
