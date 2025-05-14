/**
 * Sınav (Quiz) modelini temsil eden interface
 * @see PRD 7.4
 */
export type QuizType = "quick" | "personalized";
export type PersonalizedQuizType =
  | "weakTopicFocused"
  | "learningObjectiveFocused"
  | "newTopicFocused"
  | "comprehensive";
export type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";

// Alt konular için kompleks tip tanımı
export interface SubTopicItem {
  subTopic: string;
  normalizedSubTopic: string;
  count?: number;
}

export interface Quiz {
  id: string;
  userId: string;
  quizType: QuizType;
  personalizedQuizType?: PersonalizedQuizType | null;
  courseId: string | null;
  sourceDocument?: {
    fileName: string;
    storagePath?: string;
  } | null;
  selectedSubTopics?: string[] | null;
  preferences: {
    questionCount: number;
    difficulty: DifficultyLevel;
    timeLimit?: number;
    prioritizeWeakAndMediumTopics?: boolean;
  };
  questions: Question[];
  userAnswers: Record<string, string>;
  score: number;
  correctCount: number;
  totalQuestions: number;
  elapsedTime?: number;
  analysisResult?: AnalysisResult | null;
  timestamp: string | Date;
}

/**
 * Sınav tercihleri
 * @see PRD 7.4
 */
export interface QuizPreferences {
  questionCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  timeLimit?: number;
  topicIds?: string[];
  subTopicIds?: string[];
  personalizedQuizType?: 'weakTopicFocused' | 'learningObjectiveFocused' | 'newTopicFocused' | 'comprehensive';
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
  explanation?: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: DifficultyLevel;
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
      status: "pending" | "failed" | "medium" | "mastered";
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
    DifficultyLevel,
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
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: "easy" | "medium" | "hard";
  failedTimestamp: string;
}

/**
 * Quiz oluşturma seçenekleri
 */
export interface QuizGenerationOptions {
  quizType: QuizType;
  courseId?: string;
  personalizedQuizType?: PersonalizedQuizType | null;
  sourceDocument?: {
    fileName: string;
    storagePath: string;
  } | null;
  selectedSubTopics?: SubTopicItem[] | null;
  preferences: {
    questionCount: number;
    difficulty: DifficultyLevel;
    timeLimit?: number;
    prioritizeWeakAndMediumTopics?: boolean;
  };
}

/**
 * Quiz sonuçları
 */
export interface QuizResult {
  id: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
}

/**
 * Quiz gönderim payload'u
 */
export interface QuizSubmissionPayload {
  quizId: string;
  userAnswers: Record<string, string>;
  elapsedTime?: number;
}
