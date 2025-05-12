import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TopicDto {
  @ApiProperty({
    description: 'Alt konu adı',
    example: 'Veritabanı Normalizasyonu',
  })
  @IsString()
  @IsNotEmpty()
  subTopic: string;

  @ApiProperty({
    description: 'Normalize edilmiş alt konu adı',
    example: 'veritabani_normalizasyonu',
    required: false,
  })
  @IsString()
  @IsOptional()
  normalizedSubTopic?: string;

  @ApiProperty({
    description: 'Durum',
    example: 'pending',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Soru sayısı',
    example: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  count?: number;
}

class QuizPreferencesDto {
  @ApiProperty({
    description: 'Soru sayısı',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  questionCount: number;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium',
  })
  @IsString()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';

  @ApiProperty({
    description: 'Zaman sınırı (dakika, opsiyonel)',
    example: 15,
    minimum: 1,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  timeLimit?: number | null;

  @ApiProperty({
    description:
      'Zayıf ve orta konulara öncelik verilsin mi? (sadece comprehensive modunda)',
    example: true,
    default: true,
    required: false,
    nullable: true,
  })
  @IsBoolean()
  @IsOptional()
  prioritizeWeakAndMediumTopics?: boolean | null;
}

class DocumentSourceDto {
  @ApiProperty({
    description: 'Dosya adı',
    example: 'ders1.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'Depolama yolu',
    example: 'documents/userId/ders1.pdf',
  })
  @IsString()
  @IsNotEmpty()
  storagePath: string;
}

export class GenerateQuizDto {
  @ApiProperty({
    description: 'Sınav tipi',
    example: 'quick',
    enum: ['quick', 'personalized'],
  })
  @IsString()
  @IsEnum(['quick', 'personalized'])
  quizType: 'quick' | 'personalized';

  @ApiProperty({
    description:
      'Kişiselleştirilmiş sınav tipi (sadece quizType="personalized" olduğunda gerekli)',
    example: 'weakTopicFocused',
    enum: ['weakTopicFocused', 'newTopicFocused', 'comprehensive'],
    required: false,
    nullable: true,
  })
  @IsString()
  @IsEnum(['weakTopicFocused', 'newTopicFocused', 'comprehensive'])
  @IsOptional()
  personalizedQuizType?:
    | 'weakTopicFocused'
    | 'newTopicFocused'
    | 'comprehensive'
    | null;

  @ApiProperty({
    description: 'Ders ID (kişiselleştirilmiş sınavlar için gerekli)',
    example: '507f1f77bcf86cd799439011',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.courseId !== null)
  courseId?: string | null;

  @ApiProperty({
    description: 'Kaynak belge (hızlı sınavlar için gerekli)',
    type: DocumentSourceDto,
    required: false,
    nullable: true,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DocumentSourceDto)
  @IsOptional()
  sourceDocument?: DocumentSourceDto | null;

  @ApiProperty({
    description:
      'Seçilmiş alt konular (opsiyonel, belirtilmezse AI veya sistem tarafından seçilir)',
    type: [TopicDto],
    required: false,
    nullable: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  @IsOptional()
  selectedSubTopics?: TopicDto[] | null;

  @ApiProperty({
    description: 'Sınav tercihleri',
    type: QuizPreferencesDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => QuizPreferencesDto)
  preferences: QuizPreferencesDto;
}
