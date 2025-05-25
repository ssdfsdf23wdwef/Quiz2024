import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LearningTargetStatus {
  PENDING = 'pending',
  FAILED = 'failed',
  MEDIUM = 'medium',
  MASTERED = 'mastered',
}

export class UpdateLearningTargetDto {
  @ApiProperty({
    description: 'Öğrenme hedefinin (alt konunun) adı',
    example: 'İkinci Dereceden Denklemler',
    required: false,
  })
  @IsString({ message: 'Alt konu adı metinsel bir değer olmalıdır' })
  @IsOptional()
  subTopicName?: string;

  @ApiProperty({
    description: "Öğrenme hedefinin (alt konunun) normalleştirilmiş adı",
    example: "ikinci-dereceden-denklemler",
    required: false,
  })
  @IsString({ message: "Normalleştirilmiş alt konu adı metinsel bir değer olmalıdır" })
  @IsOptional()
  normalizedSubTopicName?: string;

  @ApiProperty({
    description: 'Öğrenme hedefinin durumu',
    enum: LearningTargetStatus,
    example: 'medium',
  })
  @IsEnum(LearningTargetStatus, {
    message:
      'Geçersiz durum değeri. Kabul edilen değerler: pending, failed, medium, mastered',
  })
  @IsOptional()
  status?: LearningTargetStatus;

  @ApiProperty({
    description: 'Başarısızlık sayısı',
    example: 2,
    required: false,
  })
  @IsNumber({}, { message: 'Başarısızlık sayısı sayısal bir değer olmalıdır' })
  @Min(0, { message: 'Başarısızlık sayısı 0 veya daha büyük olmalıdır' })
  @IsOptional()
  failCount?: number;

  @ApiProperty({
    description: 'Orta seviye başarı sayısı',
    example: 3,
    required: false,
  })
  @IsNumber(
    {},
    { message: 'Orta seviye başarı sayısı sayısal bir değer olmalıdır' },
  )
  @Min(0, { message: 'Orta seviye başarı sayısı 0 veya daha büyük olmalıdır' })
  @IsOptional()
  mediumCount?: number;

  @ApiProperty({
    description: 'Başarı sayısı',
    example: 5,
    required: false,
  })
  @IsNumber({}, { message: 'Başarı sayısı sayısal bir değer olmalıdır' })
  @Min(0, { message: 'Başarı sayısı 0 veya daha büyük olmalıdır' })
  @IsOptional()
  successCount?: number;

  @ApiProperty({
    description: 'Son deneme puan yüzdesi',
    example: 85.5,
    required: false,
  })
  @IsNumber(
    {},
    { message: 'Son deneme puan yüzdesi sayısal bir değer olmalıdır' },
  )
  @Min(0, { message: 'Son deneme puan yüzdesi 0 veya daha büyük olmalıdır' })
  @Max(100, {
    message: 'Son deneme puan yüzdesi 100 veya daha küçük olmalıdır',
  })
  @IsOptional()
  lastAttemptScorePercent?: number;
}
