import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Quiz oluşturma seçenekleri DTO'su
 */
export class CreateQuizOptionsDto {
  @ApiProperty({
    description: 'Soru sayısı',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  questionCount: number;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard', 'mixed'],
  })
  @IsString()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty: string;

  @ApiProperty({
    description: 'Zaman sınırı (dakika)',
    example: 15,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number | null;

  @ApiProperty({
    description: 'Rastgele sorular mı seçilsin?',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  randomize?: boolean;

  @ApiProperty({
    description: 'Zayıf ve orta seviyeli konulara öncelik ver',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  prioritizeWeakTopics?: boolean;

  constructor(partial: Partial<CreateQuizOptionsDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Konu seçimi DTO'su
 */
export class TopicSelectionDto {
  @ApiProperty({
    description: 'Ana konu ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  mainTopicId: string;

  @ApiProperty({
    description: 'Alt konu ID listesi',
    example: ['507f1f77bcf86cd799439022', '507f1f77bcf86cd799439033'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subTopicIds?: string[];

  constructor(partial: Partial<TopicSelectionDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Quiz oluşturma isteği DTO'su
 */
export class CreateQuizDto {
  @ApiProperty({
    description: 'Quiz başlığı',
    example: 'NestJS Temelleri Quiz',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Quiz açıklaması',
    example: 'NestJS temel kavramlarını test edin',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
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
    default: 'standard',
  })
  @IsString()
  @IsEnum([
    'standard',
    'practice',
    'challenge',
    'daily',
    'weekly',
    'assessment',
  ])
  type: string;

  @ApiProperty({
    description: 'Konu seçimi',
    type: TopicSelectionDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TopicSelectionDto)
  topicSelection?: TopicSelectionDto;

  @ApiProperty({
    description: 'Quiz oluşturma seçenekleri',
    type: CreateQuizOptionsDto,
  })
  @ValidateNested()
  @Type(() => CreateQuizOptionsDto)
  options: CreateQuizOptionsDto;

  constructor(partial: Partial<CreateQuizDto>) {
    Object.assign(this, partial);

    if (partial.options) {
      this.options = new CreateQuizOptionsDto(partial.options);
    }

    if (partial.topicSelection) {
      this.topicSelection = new TopicSelectionDto(partial.topicSelection);
    }
  }
}
