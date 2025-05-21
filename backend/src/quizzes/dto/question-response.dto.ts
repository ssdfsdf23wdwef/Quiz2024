/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Soru seçeneği DTO
 */
export class QuestionOptionDto {
  @ApiProperty({
    description: 'Seçenek ID',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'Seçenek metni',
    example: "NestJS bir Node.js framework'üdür.",
  })
  text: string;

  @ApiProperty({
    description: 'Bu seçeneğin doğru cevap olup olmadığı',
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    description: 'Seçenek açıklaması (sadece cevaplanan sorularda gönderilir)',
    example:
      "NestJS, TypeScript ile yazılmış bir Node.js framework'üdür ve Express.js üzerinde çalışır.",
    required: false,
    nullable: true,
  })
  explanation?: string | null;

  constructor(partial: Partial<QuestionOptionDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Sorunun doğru cevap detayları
 */
export class CorrectAnswerDto {
  @ApiProperty({
    description: "Doğru seçenek ID'leri",
    example: ['1', '3'],
    type: [String],
  })
  optionIds: string[];

  @ApiProperty({
    description: 'Doğru cevap açıklaması',
    example:
      "NestJS, TypeScript ile yazılmış bir Node.js framework'üdür ve mimari olarak Angular'dan ilham almıştır.",
  })
  explanation: string;

  constructor(partial: Partial<CorrectAnswerDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Soru kaynağı DTO
 */
export class QuestionSourceDto {
  @ApiProperty({
    description: 'Kaynak başlığı',
    example: 'NestJS Resmi Dokümanları',
  })
  title: string;

  @ApiProperty({
    description: 'Kaynak URL',
    example: 'https://docs.nestjs.com/',
    required: false,
    nullable: true,
  })
  url?: string | null;

  @ApiProperty({
    description: 'Kaynak türü',
    example: 'documentation',
    enum: ['documentation', 'book', 'article', 'video', 'course', 'other'],
    required: false,
  })
  type?: string;

  constructor(partial: Partial<QuestionSourceDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Soru yanıt DTO
 */
export class QuestionResponseDto {
  @ApiProperty({
    description: 'Soru ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Soru metni',
    example: 'NestJS nedir?',
  })
  text: string;

  @ApiProperty({
    description: 'Detaylı soru metni/açıklaması',
    example: 'Aşağıdakilerden hangisi NestJS için doğrudur?',
    required: false,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Soru tipi',
    example: 'multiple_choice',
    enum: [
      'multiple_choice',
      'single_choice',
      'true_false',
      'coding',
      'open_ended',
    ],
  })
  type: string;

  @ApiProperty({
    description: 'Soru formatı',
    example: 'text',
    enum: ['text', 'code', 'image', 'mixed'],
    default: 'text',
  })
  format: string;

  @ApiProperty({
    description: 'Ana konu',
    example: 'Web Frameworks',
  })
  mainTopic: string;

  @ApiProperty({
    description: 'Alt konu',
    example: 'NestJS',
  })
  subTopic: string;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Tahmini cevaplama süresi (saniye)',
    example: 60,
  })
  estimatedTime: number;

  @ApiProperty({
    description: 'Soru seçenekleri',
    type: [QuestionOptionDto],
  })
  @Type(() => QuestionOptionDto)
  options: QuestionOptionDto[];

  @ApiProperty({
    description: 'Kod veya özel içerik metni',
    example: 'function example() { return "Hello World"; }',
    required: false,
    nullable: true,
  })
  codeContent?: string | null;

  @ApiProperty({
    description: 'Kod dilinin sözdizimi vurgulaması için tanımlayıcı',
    example: 'typescript',
    required: false,
    nullable: true,
  })
  language?: string | null;

  @ApiProperty({
    description: 'Soru etiketleri',
    example: ['nestjs', 'backend', 'framework'],
    type: [String],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description:
      'Sorunun doğru cevabı (sadece oturum tipine ve kullanıcının cevap vermesine bağlı olarak gönderilir)',
    type: CorrectAnswerDto,
    required: false,
    nullable: true,
  })
  @Type(() => CorrectAnswerDto)
  correctAnswer?: CorrectAnswerDto | null;

  @ApiProperty({
    description:
      'Kullanıcının verdiği cevabın doğru olup olmadığı (sadece kullanıcı cevap vermişse gönderilir)',
    example: true,
    required: false,
    nullable: true,
  })
  isUserCorrect?: boolean | null;

  @ApiProperty({
    description:
      "Kullanıcının seçtiği seçenek ID'leri (sadece kullanıcı cevap vermişse gönderilir)",
    example: ['1', '3'],
    type: [String],
    required: false,
    nullable: true,
  })
  userSelectedOptionIds?: string[] | null;

  @ApiProperty({
    description: 'Soru kaynakları',
    type: [QuestionSourceDto],
    required: false,
  })
  @Type(() => QuestionSourceDto)
  sources?: QuestionSourceDto[];

  @ApiProperty({
    description: 'Soru oluşturulma tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Soru güncelleme tarihi',
    example: '2023-01-01T12:00:00Z',
  })
  updatedAt: string;

  constructor(partial: Partial<QuestionResponseDto>) {
    Object.assign(this, partial);

    // Helper function to check if a value is a Date
    function isDateObject(value: any): boolean {
      return (
        value &&
        typeof value === 'object' &&
        'getTime' in value &&
        typeof value.getTime === 'function'
      );
    }

    // Tarih alanları için ISO string formatına dönüştürme
    if (partial.createdAt && isDateObject(partial.createdAt)) {
      this.createdAt = (partial.createdAt as unknown as Date).toISOString();
    }

    if (partial.updatedAt && isDateObject(partial.updatedAt)) {
      this.updatedAt = (partial.updatedAt as unknown as Date).toISOString();
    }

    // Alt nesneler için tip dönüşümlerini gerçekleştir
    if (partial.options && Array.isArray(partial.options)) {
      this.options = partial.options.map(
        (option) => new QuestionOptionDto(option),
      );
    }

    if (partial.correctAnswer) {
      this.correctAnswer = new CorrectAnswerDto(partial.correctAnswer);
    }

    if (partial.sources && Array.isArray(partial.sources)) {
      this.sources = partial.sources.map(
        (source) => new QuestionSourceDto(source),
      );
    }
  }
}
