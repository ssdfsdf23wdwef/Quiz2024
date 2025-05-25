import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LearningTargetStatus } from '../../common/types/learning-target.type';

export class UpdateLearningTargetDto {
  @ApiProperty({
    description: 'Öğrenme hedefinin durumu',
    enum: LearningTargetStatus,
    required: false,
  })
  @IsEnum(LearningTargetStatus, {
    message: 'Geçersiz durum değeri. Kabul edilen değerler: Not Started, In Progress, Completed',
  })
  @IsOptional()
  status?: LearningTargetStatus;

  @ApiProperty({
    description: 'Öğrenme hedefi konusu',
    required: false,
  })
  @IsString()
  @IsOptional()
  topicName?: string;

  @ApiProperty({
    description: 'Kullanıcının ekleyebileceği notlar',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
