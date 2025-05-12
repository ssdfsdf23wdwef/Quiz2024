import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { QuestionResponseDto } from '../../../questions/dto/responses/question-response.dto';

/**
 * Quiz içindeki soruları gösteren DTO
 */
export class QuizQuestionDto {
  @ApiProperty({
    description: 'Quiz sorusu',
    type: QuestionResponseDto,
  })
  @Type(() => QuestionResponseDto)
  question: QuestionResponseDto;

  @ApiProperty({
    description: 'Sorunun quiz içindeki sırası',
    example: 1,
  })
  order: number;

  @ApiProperty({
    description: 'Kullanıcının bu soruya ayırdığı süre (saniye)',
    example: 45,
    required: false,
    nullable: true,
  })
  timeSpent?: number | null;

  @ApiProperty({
    description: 'Kullanıcının bu soruya verdiği cevabın doğru olup olmadığı',
    example: true,
    required: false,
    nullable: true,
  })
  isCorrect?: boolean | null;

  constructor(partial: Partial<QuizQuestionDto>) {
    Object.assign(this, partial);

    if (partial.question) {
      this.question = new QuestionResponseDto(partial.question);
    }
  }
}

/**
 * Quiz sonuç özeti DTO'su
 */
export class QuizResultSummaryDto {
  @ApiProperty({
    description: 'Doğru cevap sayısı',
    example: 8,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Toplam soru sayısı',
    example: 10,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğruluk oranı (yüzde)',
    example: 80,
  })
  correctRate: number;

  @ApiProperty({
    description: 'Toplam quiz süresi (saniye)',
    example: 450,
  })
  totalTimeSpent: number;

  @ApiProperty({
    description: 'Ortalama soru başına harcanan süre (saniye)',
    example: 45,
  })
  averageTimePerQuestion: number;

  constructor(partial: Partial<QuizResultSummaryDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Konu bazlı quiz performansı DTO'su
 */
export class TopicPerformanceDto {
  @ApiProperty({
    description: 'Konu adı',
    example: 'NestJS',
  })
  topic: string;

  @ApiProperty({
    description: 'Doğru cevap sayısı',
    example: 3,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Toplam soru sayısı',
    example: 4,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğruluk oranı (yüzde)',
    example: 75,
  })
  correctRate: number;

  constructor(partial: Partial<TopicPerformanceDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Zorluk seviyesi bazlı quiz performansı DTO'su
 */
export class DifficultyPerformanceDto {
  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Doğru cevap sayısı',
    example: 3,
  })
  correctAnswers: number;

  @ApiProperty({
    description: 'Toplam soru sayısı',
    example: 4,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğruluk oranı (yüzde)',
    example: 75,
  })
  correctRate: number;

  constructor(partial: Partial<DifficultyPerformanceDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Quiz yanıt DTO'su
 */
export class QuizResponseDto {
  @ApiProperty({
    description: 'Quiz ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Quiz başlığı',
    example: 'NestJS Temelleri Quiz',
  })
  title: string;

  @ApiProperty({
    description: 'Quiz açıklaması',
    example: 'NestJS temel kavramlarını test edin',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Quiz tipi',
    example: 'standard',
    enum: [
      'standard',
      'practice',
      'challenge',
      'daily',
      'weekly',
      'assessment',
    ],
  })
  type: string;

  @ApiProperty({
    description: 'Ana konu',
    example: 'Web Frameworks',
    required: false,
  })
  mainTopic?: string;

  @ApiProperty({
    description: 'Alt konu',
    example: 'NestJS',
    required: false,
  })
  subTopic?: string;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard', 'mixed'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Quiz içindeki sorular',
    type: [QuizQuestionDto],
  })
  @Type(() => QuizQuestionDto)
  questions: QuizQuestionDto[];

  @ApiProperty({
    description: 'Quiz sonuç özeti (sadece tamamlanan quizlerde gönderilir)',
    type: QuizResultSummaryDto,
    required: false,
    nullable: true,
  })
  @Type(() => QuizResultSummaryDto)
  resultSummary?: QuizResultSummaryDto | null;

  @ApiProperty({
    description:
      'Konu bazlı performans (sadece tamamlanan quizlerde gönderilir)',
    type: [TopicPerformanceDto],
    required: false,
  })
  @Type(() => TopicPerformanceDto)
  topicPerformance?: TopicPerformanceDto[];

  @ApiProperty({
    description:
      'Zorluk seviyesi bazlı performans (sadece tamamlanan quizlerde gönderilir)',
    type: [DifficultyPerformanceDto],
    required: false,
  })
  @Type(() => DifficultyPerformanceDto)
  difficultyPerformance?: DifficultyPerformanceDto[];

  @ApiProperty({
    description: 'Tamamlanma durumu',
    example: true,
  })
  isCompleted: boolean;

  @ApiProperty({
    description: 'Quiz durumu',
    example: 'completed',
    enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
  })
  status: string;

  @ApiProperty({
    description: 'Quiz başlangıç tarihi',
    example: '2023-01-01T12:00:00Z',
    required: false,
    nullable: true,
  })
  startedAt?: string | null;

  @ApiProperty({
    description: 'Quiz bitiş tarihi',
    example: '2023-01-01T12:15:00Z',
    required: false,
    nullable: true,
  })
  completedAt?: string | null;

  @ApiProperty({
    description: 'Quiz oluşturulma tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Quiz güncelleme tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  updatedAt: string;

  constructor(partial: Partial<QuizResponseDto>) {
    Object.assign(this, partial);

    // Tarih alanları için ISO string formatına dönüştürme
    if (
      partial.startedAt &&
      typeof partial.startedAt === 'object' &&
      'toISOString' in partial.startedAt
    ) {
      this.startedAt = (partial.startedAt as Date).toISOString();
    }
    if (
      partial.completedAt &&
      typeof partial.completedAt === 'object' &&
      'toISOString' in partial.completedAt
    ) {
      this.completedAt = (partial.completedAt as Date).toISOString();
    }
    if (
      partial.createdAt &&
      typeof partial.createdAt === 'object' &&
      'toISOString' in partial.createdAt
    ) {
      this.createdAt = (partial.createdAt as Date).toISOString();
    }
    if (
      partial.updatedAt &&
      typeof partial.updatedAt === 'object' &&
      'toISOString' in partial.updatedAt
    ) {
      this.updatedAt = (partial.updatedAt as Date).toISOString();
    }

    // Alt nesneler için tip dönüşümlerini gerçekleştir
    if (partial.questions && Array.isArray(partial.questions)) {
      this.questions = partial.questions.map(
        (question) => new QuizQuestionDto(question),
      );
    }

    if (partial.resultSummary) {
      this.resultSummary = new QuizResultSummaryDto(partial.resultSummary);
    }

    if (partial.topicPerformance && Array.isArray(partial.topicPerformance)) {
      this.topicPerformance = partial.topicPerformance.map(
        (topic) => new TopicPerformanceDto(topic),
      );
    }

    if (
      partial.difficultyPerformance &&
      Array.isArray(partial.difficultyPerformance)
    ) {
      this.difficultyPerformance = partial.difficultyPerformance.map(
        (difficulty) => new DifficultyPerformanceDto(difficulty),
      );
    }
  }
}
