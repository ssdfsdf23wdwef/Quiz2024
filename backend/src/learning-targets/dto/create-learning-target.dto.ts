import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLearningTargetDto {
  @ApiProperty({ description: 'Kullanıcı ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Kurs ID' })
  @IsString()
  courseId: string;

  @ApiProperty({ description: 'Alt konu adı' })
  @IsString()
  subTopicName: string;

  @ApiProperty({ description: 'Normalize edilmiş alt konu adı' })
  @IsString()
  normalizedSubTopicName: string;

  @ApiProperty({ description: 'Öğrenme hedefi durumu', example: 'pending' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Son deneme skoru (yüzde)', required: false })
  @IsNumber()
  @IsOptional()
  lastAttemptScorePercent?: number;

  @ApiProperty({ description: 'Başarısız deneme sayısı', required: false })
  @IsNumber()
  @IsOptional()
  failCount?: number;

  @ApiProperty({ description: 'Orta deneme sayısı', required: false })
  @IsNumber()
  @IsOptional()
  mediumCount?: number;

  @ApiProperty({ description: 'Başarılı deneme sayısı', required: false })
  @IsNumber()
  @IsOptional()
  successCount?: number;

  @ApiProperty({
    description: 'Son kişiselleştirilmiş sınav ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastPersonalizedQuizId?: string;
}
