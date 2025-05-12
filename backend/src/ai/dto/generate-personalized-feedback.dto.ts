import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Generate Personalized Feedback DTO yükleniyor',
    'generate-personalized-feedback.dto',
    __filename,
    15,
  );
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

// Nested DTO for a single quiz question (based on ai.service.ts usage)
export class QuizQuestionDto {
  @ApiProperty({ description: 'The unique ID of the question', example: 'q1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'The text of the question',
    example: 'What is...?',
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Possible answer options',
    example: ['A', 'B', 'C', 'D'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];

  @ApiProperty({ description: 'The correct answer option', example: 'A' })
  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  // Added fields needed by the service for feedback generation
  @ApiProperty({
    description: 'The sub-topic this question belongs to',
    example: 'Convolutional Layers',
  })
  @IsString()
  @IsNotEmpty()
  subTopicName: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  // Add other relevant fields if needed by the service
  // e.g., @ApiPropertyOptional() @IsString() explanation?: string;
}

// Main DTO for personalized feedback
export class GeneratePersonalizedFeedbackDto {
  @ApiProperty({
    description: 'The list of quiz questions presented to the user',
    type: [QuizQuestionDto], // Specify the nested type for Swagger
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto) // Important for class-validator
  quizQuestions: QuizQuestionDto[];

  @ApiProperty({
    description: "User's answers, mapping question ID to the selected answer",
    example: { q1: 'A', q2: 'C' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsObject()
  @IsNotEmpty()
  // No specific validation for keys/values needed unless required
  userAnswers: Record<string, string>;

  // Loglama için yardımcı metot (sadece belgelendirme ve entegrasyon amaçlı)
  logDto(): void {
    try {
      const logger = LoggerService.getInstance();
      logger.debug(
        'Generate Personalized Feedback DTO oluşturuldu',
        'GeneratePersonalizedFeedbackDto.logDto',
        __filename,
        89,
        {
          questionCount: this.quizQuestions?.length || 0,
          answersCount: Object.keys(this.userAnswers || {}).length || 0,
        },
      );
    } catch (error) {
      console.error('DTO loglanırken hata:', error);
    }
  }
}
