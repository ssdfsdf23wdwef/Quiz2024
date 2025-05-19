import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsBoolean,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TopicDto } from './generate-quiz.dto';

class QuestionDto {
  @ApiProperty({
    description: 'Soru ID',
    example: 'q_1628847892_0',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Soru metni',
    example:
      'Aşağıdakilerden hangisi NestJS middleware tiplerinden biri değildir?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Cevap seçenekleri',
    example: [
      'Route Middleware',
      'Controller Middleware',
      'Global Middleware',
      'Function Middleware',
    ],
    type: [String],
  })
  @IsArray()
  options: string[];

  @ApiProperty({
    description: 'Doğru cevap',
    example: 'Controller Middleware',
  })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @ApiProperty({
    description: 'Açıklama',
    example:
      "NestJS üç tür middleware sunar: route-specific, global, ve function middleware. Controller Middleware NestJS'te bir middleware tipi değildir.",
  })
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @ApiProperty({
    description: 'Konu adı',
    example: 'NestJS Middleware Kavramları',
  })
  @IsString()
  @IsNotEmpty()
  subTopic: string;

  @ApiProperty({
    description: 'Normalize edilmiş konu adı',
    example: 'nestjs_middleware_kavramlari',
  })
  @IsString()
  @IsNotEmpty()
  normalizedSubTopic: string;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard'],
  })
  @IsString()
  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: 'easy' | 'medium' | 'hard';
}

class DocumentSourceDto {
  @ApiProperty({
    description: 'Belge adı',
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

  @ApiProperty({
    description: 'Belge ID (FireStore)',
    example: 'abc123def456',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentId?: string;
}

class QuizPreferencesDto {
  @ApiProperty({
    description: 'Soru sayısı',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  questionCount: number;

  @ApiProperty({
    description: 'Zorluk seviyesi',
    example: 'medium',
    enum: ['easy', 'medium', 'hard', 'mixed'],
  })
  @IsString()
  @IsEnum(['easy', 'medium', 'hard', 'mixed'])
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';

  @ApiProperty({
    description: 'Zaman sınırı (dakika, opsiyonel)',
    example: 15,
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
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  prioritizeWeakAndMediumTopics?: boolean | null;
}

export class SubmitQuizDto {
  @ApiProperty({
    description: 'Sınav tipi',
    example: 'quick',
    enum: ['quick', 'personalized', 'review'],
  })
  @IsString()
  @IsEnum(['quick', 'personalized', 'review'])
  @IsNotEmpty()
  quizType: 'quick' | 'personalized' | 'review';

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
    description: 'Seçilmiş alt konular',
    example: [],
    required: false,
    nullable: true,
  })
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

  @ApiProperty({
    description: 'Sorular',
    type: [QuestionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @ApiProperty({
    description: 'Kullanıcı cevapları',
    example: {
      q_1628847892_0: 'Middleware Component',
      q_1628847892_1: 'Injectable',
    },
    type: Object,
    additionalProperties: true,
  })
  @IsObject()
  userAnswers: Record<string, string>;

  @ApiProperty({
    description: 'Geçen süre (saniye)',
    example: 287.5,
    required: false,
    nullable: true,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  elapsedTime?: number | null;
}
