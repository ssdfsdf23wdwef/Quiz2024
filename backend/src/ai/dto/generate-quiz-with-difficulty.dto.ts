import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizDifficulty } from '../enums/quiz-difficulty.enum'; // Assuming enum exists
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Generate Quiz With Difficulty DTO yükleniyor',
    'generate-quiz-with-difficulty.dto',
    __filename,
    17,
  );
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

// Nested class for difficulty distribution
export class DifficultyDistributionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  easy: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  medium: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  hard: number;
}

// Main DTO
export class GenerateQuizWithDifficultyDto {
  @ApiProperty({ description: 'The ID of the course', example: 'course123' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'List of sub-topics to generate questions for',
    example: ['Convolutional Layers', 'Recurrent Neural Networks'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  subTopics: string[];

  @ApiProperty({
    description: 'Total number of questions to generate',
    example: 10,
  })
  @IsInt()
  @Min(1)
  questionCount: number;

  @ApiPropertyOptional({
    description: 'Overall difficulty level (if distribution is not provided)',
    enum: QuizDifficulty,
    example: QuizDifficulty.MEDIUM,
  })
  @IsOptional()
  @IsEnum(QuizDifficulty)
  difficulty?: QuizDifficulty = QuizDifficulty.MEDIUM;

  @ApiPropertyOptional({
    description: 'Specific distribution of questions by difficulty',
    type: DifficultyDistributionDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DifficultyDistributionDto)
  difficultyDistribution: DifficultyDistributionDto;

  @ApiPropertyOptional({
    description: 'Context text (e.g., document content) for generation',
    example: 'Convolutional Neural Networks (CNNs) are a class of deep...',
  })
  @IsOptional()
  @IsString()
  documentText?: string;

  // Loglama için yardımcı metot
  logDto(): void {
    try {
      const logger = LoggerService.getInstance();
      logger.debug(
        'Generate Quiz With Difficulty DTO oluşturuldu',
        'GenerateQuizWithDifficultyDto.logDto',
        __filename,
        92,
        {
          courseId: this.courseId,
          subTopicCount: this.subTopics?.length || 0,
          questionCount: this.questionCount,
          difficulty: this.difficulty,
          hasDistribution: !!this.difficultyDistribution,
          hasDocumentText: !!this.documentText,
        },
      );
    } catch (error) {
      console.error('DTO loglanırken hata:', error);
    }
  }
}
