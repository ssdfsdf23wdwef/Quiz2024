/**
 * Sınav (Quiz) modelini temsil eden interface
 * @see PRD 7.4
 */
export type QuizType = "general" | "personalized" | "topic_specific"; // Updated to include "general" and "topic_specific"
export type PersonalizedQuizFocus = "weaknesses" | "strengths" | "new_topics" | "comprehensive";
export type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";

export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type QuestionStatus = "active" | "inactive" | "draft";

export interface SubTopic {
  id?: string; // Optional ID, if available from backend
  name: string;
}

export interface MainTopic {
  id?: string; // Optional ID
  name: string;
  subTopics?: SubTopic[];
}

export type Topics = Record<string, MainTopic>;

export interface DocumentTopics {
  topics: Topics;
  source: "documentId" | "file" | "text" | "course"; // Added course
}

export interface Quiz {
  id: string;
  title: string;
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
  
  // Alt konu bilgileri - AI yanıtından gelen alanlar
  subTopic: string;
  normalizedSubTopic: string;
  
  // AI yanıtında bu alanlar gelebilir, bunları da tanımlayalım
  subTopicName?: string;       // AI çıktısında gelen alt konu adı
  normalizedSubTopicName?: string;  // AI çıktısında normalize edilmiş alt konu adı
  
  difficulty: DifficultyLevel;
  questionType: QuestionType;
  status: QuestionStatus;
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
  title?: string;
  description?: string;
  userId?: string;
  courseId?: string;
  personalizedQuizType?: PersonalizedQuizType | null;
  documentText?: string;
  documentId?: string;
  sourceDocument?: {
    fileName: string;
    storagePath: string;
  } | null;
  selectedSubTopics?: string[] | SubTopic[] | null;
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
