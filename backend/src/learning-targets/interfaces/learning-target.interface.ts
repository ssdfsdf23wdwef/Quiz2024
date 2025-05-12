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
