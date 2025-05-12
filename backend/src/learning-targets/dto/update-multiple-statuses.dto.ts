import {
  IsArray,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LearningTargetStatus } from '../interfaces/learning-target.interface';
import { ApiProperty } from '@nestjs/swagger';

export class TargetUpdateDto {
  @ApiProperty({
    description: 'Öğrenme hedefi ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Öğrenme hedefinin durumu',
    enum: ['pending', 'failed', 'medium', 'mastered'],
    example: 'medium',
  })
  @IsString()
  status: LearningTargetStatus;

  @ApiProperty({
    description: 'Son deneme puan yüzdesi (0-100 arası)',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  lastAttemptScorePercent: number;
}

export class UpdateMultipleStatusesDto {
  targets(
    targets: any,
    courseId: any,
    userId: any,
  ):
    | import('../../common/interfaces').LearningTargetWithQuizzes[]
    | PromiseLike<
        import('../../common/interfaces').LearningTargetWithQuizzes[]
      > {
    throw new Error('Method not implemented.');
  }
  @ApiProperty({
    description: 'Güncellenmesi istenen hedefler listesi',
    type: [TargetUpdateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TargetUpdateDto)
  targetUpdates: TargetUpdateDto[];
}
