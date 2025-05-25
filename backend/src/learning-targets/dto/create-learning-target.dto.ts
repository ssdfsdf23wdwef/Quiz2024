import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LearningTargetStatus } from '../../common/types/learning-target.type';

export class CreateLearningTargetDto {
  @ApiProperty({ description: 'Konu adı' })
  @IsString()
  topicName: string;

  @ApiProperty({ description: 'Kurs ID (opsiyonel)', required: false })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Öğrenme hedefi durumu',
    enum: LearningTargetStatus,
    default: LearningTargetStatus.NOT_STARTED,
    required: false,
  })
  @IsEnum(LearningTargetStatus)
  @IsOptional()
  status?: LearningTargetStatus;

  @ApiProperty({
    description: 'Kullanıcının ekleyebileceği notlar',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  // Not: isNewTopic burada false, source 'manual' olacak - servis tarafında ayarlanacak
}
