import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Güçlü ve zayıf konu performansı DTO
 */
export class TopicPerformanceDto {
  @ApiProperty({
    description: 'Konu adı',
    example: 'NestJS Middleware',
  })
  subTopic: string;

  @ApiProperty({
    description: 'Normalize edilmiş konu adı',
    example: 'nestjs_middleware',
  })
  normalizedSubTopic: string;

  @ApiProperty({
    description: 'Doğru cevap oranı (0-1 arası)',
    example: 0.75,
  })
  correctRate: number;

  @ApiProperty({
    description: 'Toplam soru sayısı',
    example: 4,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğru cevaplanan soru sayısı',
    example: 3,
  })
  correctAnswers: number;

  constructor(partial: Partial<TopicPerformanceDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Zorluk seviyesi performansı DTO
 */
export class DifficultyPerformanceDto {
  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Doğru cevap oranı (0-1 arası)',
    example: 0.75,
  })
  correctRate: number;

  @ApiProperty({
    description: 'Toplam soru sayısı',
    example: 4,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Doğru cevaplanan soru sayısı',
    example: 3,
  })
  correctAnswers: number;

  constructor(partial: Partial<DifficultyPerformanceDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Sınav analiz sonucu DTO
 */
export class QuizAnalysisResponseDto {
  @ApiProperty({
    description: 'Sınav ID',
    example: '507f1f77bcf86cd799439011',
  })
  quizId: string;

  @ApiProperty({
    description: 'Genel skor (0-100)',
    example: 75.5,
  })
  overallScore: number;

  @ApiProperty({
    description: 'Güçlü konular',
    type: [TopicPerformanceDto],
  })
  @Type(() => TopicPerformanceDto)
  strongTopics: TopicPerformanceDto[];

  @ApiProperty({
    description: 'Zayıf konular',
    type: [TopicPerformanceDto],
  })
  @Type(() => TopicPerformanceDto)
  weakTopics: TopicPerformanceDto[];

  @ApiProperty({
    description: 'Orta seviyede bilinen konular',
    type: [TopicPerformanceDto],
  })
  @Type(() => TopicPerformanceDto)
  mediumTopics: TopicPerformanceDto[];

  @ApiProperty({
    description: 'Zorluk seviyesi bazında performans',
    type: [DifficultyPerformanceDto],
  })
  @Type(() => DifficultyPerformanceDto)
  difficultyBreakdown: DifficultyPerformanceDto[];

  @ApiProperty({
    description: 'Tavsiyeler',
    example: [
      'NestJS Middleware konusunu daha fazla çalışmanız önerilir.',
      'Validation Pipes konusundaki başarınız çok iyi, bu tempoyu koruyun.',
    ],
    type: [String],
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Önerilen kaynaklar',
    example: [
      {
        title: 'NestJS Middleware Dokümantasyonu',
        url: 'https://docs.nestjs.com/middleware',
      },
      {
        title: 'Middleware Kullanım Örnekleri',
        url: 'https://docs.nestjs.com/middleware#functional-middleware',
      },
    ],
    required: false,
    nullable: true,
  })
  recommendedResources?:
    | {
        title: string;
        url: string;
      }[]
    | null;

  @ApiProperty({
    description: 'Bu sınavda yanıtlanan soruların kilit noktaları',
    example: [
      "NestJS middleware'ler request lifecycle içinde interceptor'lardan önce çalışır.",
      "Global middleware'ler tüm rotalara uygulanır.",
    ],
    type: [String],
  })
  keyInsights: string[];

  @ApiProperty({
    description: 'Analiz oluşturulma zamanı',
    example: '2023-01-01T12:00:00Z',
  })
  timestamp: string;

  constructor(partial: Partial<QuizAnalysisResponseDto>) {
    Object.assign(this, partial);

    // Tarih ise ISO string formatına dönüştür
    if (partial.timestamp && this.isDateLike(partial.timestamp)) {
      this.timestamp = (partial.timestamp as any).toISOString();
    }

    // Alt nesneler için tip dönüşümlerini gerçekleştir
    if (partial.strongTopics && Array.isArray(partial.strongTopics)) {
      this.strongTopics = partial.strongTopics.map(
        (topic) => new TopicPerformanceDto(topic),
      );
    }

    if (partial.weakTopics && Array.isArray(partial.weakTopics)) {
      this.weakTopics = partial.weakTopics.map(
        (topic) => new TopicPerformanceDto(topic),
      );
    }

    if (partial.mediumTopics && Array.isArray(partial.mediumTopics)) {
      this.mediumTopics = partial.mediumTopics.map(
        (topic) => new TopicPerformanceDto(topic),
      );
    }

    if (
      partial.difficultyBreakdown &&
      Array.isArray(partial.difficultyBreakdown)
    ) {
      this.difficultyBreakdown = partial.difficultyBreakdown.map(
        (difficulty) => new DifficultyPerformanceDto(difficulty),
      );
    }
  }

  private isDateLike(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      value !== null &&
      'toISOString' in value &&
      typeof value.toISOString === 'function'
    );
  }
}
