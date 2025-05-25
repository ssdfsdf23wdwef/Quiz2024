/**
 * Learning target status enum
 */
export enum LearningTargetStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

/**
 * Learning target source type
 */
export type LearningTargetSource = 'ai_proposal' | 'manual' | 'document_import';

/**
 * Learning target interface
 */
export interface LearningTarget {
  id: string;
  userId: string;
  courseId?: string;
  topicName: string;
  status: LearningTargetStatus;
  isNewTopic: boolean;
  source: LearningTargetSource;
  originalProposedId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Learning target with additional quiz data
 */
export interface LearningTargetWithQuizzes extends LearningTarget {
  quizzes: string[]; // Quiz IDs
  lastAttempt: Date | null;
  lastAttemptScorePercent: number | null;
  failCount: number;
  mediumCount: number;
  successCount: number;
  attemptCount: number;
}

/**
 * Create learning target DTO
 */
export interface CreateLearningTargetDto {
  courseId?: string;
  topicName: string;
  status?: LearningTargetStatus;
  notes?: string;
}

/**
 * Update learning target DTO
 */
export interface UpdateLearningTargetDto {
  topicName?: string;
  status?: LearningTargetStatus;
  notes?: string;
}

/**
 * Detect new topics DTO
 */
export interface DetectNewTopicsDto {
  courseId?: string;
  existingTopicTexts: string[];
  contextText?: string;
}

/**
 * Proposed topic from AI
 */
export interface ProposedTopic {
  tempId: string;
  name: string;
  relevance?: string;
  details?: string;
}

/**
 * Confirm new topics DTO
 */
export interface ConfirmNewTopicsDto {
  courseId: string;
  selectedTopics: ProposedTopic[];
}
