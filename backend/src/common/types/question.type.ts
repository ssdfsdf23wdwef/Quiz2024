/**
 * Soru (Question) modelini temsil eden interface
 * @see PRD 7.5
 */
export interface Question {
  id: string;
  questionText: string;
  description?: string | null;
  type:
    | 'multiple_choice'
    | 'single_choice'
    | 'true_false'
    | 'coding'
    | 'open_ended';
  format: 'text' | 'code' | 'image' | 'mixed';
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  mainTopic: string;
  subTopic: string;
  normalizedSubTopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  codeContent?: string | null;
  language?: string | null;
}

/**
 * Soru seçeneği
 */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Başarısız Soru modelini temsil eden interface
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
 * Soru oluşturma DTO
 */
export interface CreateQuestionDto {
  text: string;
  description?: string | null;
  type:
    | 'multiple_choice'
    | 'single_choice'
    | 'true_false'
    | 'coding'
    | 'open_ended';
  format?: 'text' | 'code' | 'image' | 'mixed';
  mainTopic: string;
  subTopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  codeContent?: string | null;
  language?: string | null;
  estimatedTime?: number;
}

/**
 * Soru güncelleme DTO
 */
export interface UpdateQuestionDto {
  text?: string;
  description?: string | null;
  type?:
    | 'multiple_choice'
    | 'single_choice'
    | 'true_false'
    | 'coding'
    | 'open_ended';
  format?: 'text' | 'code' | 'image' | 'mixed';
  mainTopic?: string;
  subTopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  codeContent?: string | null;
  language?: string | null;
  estimatedTime?: number;
}
