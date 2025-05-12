import { LoggerService } from '../../common/services/logger.service';

/**
 * Sınav zorluk seviyeleri
 */
export enum QuizDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Quiz Difficulty enum yüklendi',
    'quiz-difficulty.enum',
    __filename,
    12,
  );
} catch (error) {
  console.error('Enum yüklenirken hata:', error);
}
