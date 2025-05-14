import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  MIXED = 'mixed',
}

export class SubTopicDto {
  @ApiProperty({
    description: 'Alt konu adı',
    example: 'Cebir',
  })
  @IsString()
  @IsNotEmpty()
  subTopicName: string;

  @ApiProperty({
    description: 'Normalize edilmiş alt konu adı',
    example: 'cebir',
  })
  @IsString()
  @IsNotEmpty()
  normalizedSubTopicName: string;
}

export class CreateQuizFromDocumentDto {
  @ApiPropertyOptional({
    description:
      'Sınavda kullanılacak alt konular (belirtilmezse otomatik tespit edilir)',
    type: [SubTopicDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => SubTopicDto)
  subTopics?: SubTopicDto[];

  @ApiPropertyOptional({
    description: 'Sınav soru sayısı',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  questionCount?: number;

  @ApiPropertyOptional({
    description: 'Zorluk seviyesi',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
    default: DifficultyLevel.MEDIUM,
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Sınav zaman limiti (dakika)',
    example: 30,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  timeLimit?: number;
}
