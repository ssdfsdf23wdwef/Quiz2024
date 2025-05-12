import { Question } from './question.type';

/**
 * Sınav (Quiz) modelini temsil eden interface
 * @see PRD 7.4
 */
export interface Quiz {
  id: string;
  userId: string;
  courseId?: string | null;
  quizType: string;
  personalizedQuizType: string | null;
  sourceDocument?: DocumentSource | null;
  selectedSubTopics?: TopicSelection[] | null;
  preferences: QuizPreferences;
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedTime?: number | null;
  analysisResult?: AnalysisResult | null;
  timestamp: Date | string;
}

/**
 * Quiz tercihleri
 */
export interface QuizPreferences {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  timeLimit?: number | null;
  prioritizeWeakAndMediumTopics?: boolean | null;
}

/**
 * Doküman kaynak bilgisi (quiz için)
 */
export interface DocumentSource {
  documentId: string;
  fileName: string;
  fileType: string;
  storagePath: string;
}

/**
 * Konu seçimi
 */
export interface TopicSelection {
  subTopic: string;
  normalizedSubTopic: string;
  count?: number;
}

/**
 * Sınav oluşturma DTO
 */
export interface GenerateQuizDto {
  quizType: 'quick' | 'personalized';
  personalizedQuizType?:
    | 'weakTopicFocused'
    | 'newTopicFocused'
    | 'comprehensive'
    | null;
  courseId?: string | null;
  sourceDocument?: DocumentSource | null;
  selectedSubTopics?: TopicSelection[] | null;
  preferences: QuizPreferences;
}

/**
 * Sınav gönderme DTO
 */
export interface SubmitQuizDto {
  quizType: 'quick' | 'personalized' | 'review';
  personalizedQuizType?:
    | 'weakTopicFocused'
    | 'newTopicFocused'
    | 'comprehensive'
    | null;
  courseId?: string | null;
  sourceDocument?: DocumentSource | null;
  selectedSubTopics?: TopicSelection[] | null;
  preferences: QuizPreferences;
  questions: QuestionDto[];
}

/**
 * Soru DTO (submit için)
 */
export interface QuestionDto {
  id: string;
  text: string;
  options: string[];
  userAnswer: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: string;
  elapsedTime?: number | null;
}

/**
 * Sınav Analiz Sonucu
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
 * Quiz özet bilgisi
 */
export interface QuizSummary {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  questionCount: number;
  score?: number | null;
  completedAt?: string | null;
  timestamp: string;
}

/**
 * Konu performansı
 */
export interface TopicPerformance {
  subTopic: string;
  normalizedSubTopic: string;
  score: number;
  questionCount: number;
  status: 'weak' | 'medium' | 'strong';
}

/**
 * Quiz sonuç özeti
 */
export interface QuizResultSummary {
  correctCount: number;
  totalQuestions: number;
  score: number;
  time: number | null;
  improvementAreas: string[];
  strongAreas: string[];
}
