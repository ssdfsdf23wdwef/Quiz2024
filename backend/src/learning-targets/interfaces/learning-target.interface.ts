export type LearningTargetStatus = 'pending' | 'failed' | 'medium' | 'mastered';

export interface LearningTargetWithQuizzes {
  id: string;
  userId: string;
  status: LearningTargetStatus;
  lastAttempt?: Date;
  lastAttemptScorePercent?: number;
  failCount: number;
  mediumCount: number;
  successCount: number;
  lastPersonalizedQuizId?: string;
  source?: 'user_created' | 'document_extracted' | 'ai_generated_new' | 'legacy';
  quizzes: Array<{
    id: string;
    type: string;
    completedAt: Date;
    questions: Array<{
      subTopicName: string;
      scorePercent: number;
    }>;
  }>;
}
