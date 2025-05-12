import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class TopicDto {
  @ApiProperty({
    description: 'Alt konu adı',
    example: 'Veritabanı Normalizasyonu',
  })
  @IsString()
  @IsNotEmpty()
  subTopicName: string;

  @ApiProperty({
    description:
      'Normalize edilmiş alt konu adı (opsiyonel, backend tarafından oluşturulabilir)',
    example: 'veritabani_normalizasyonu',
    required: false,
  })
  @IsString()
  @IsOptional()
  normalizedSubTopicName?: string;
}

export class CreateBatchLearningTargetsDto {
  @ApiProperty({
    description: 'Ders ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    description: 'Öğrenme hedefi olarak eklenmesi istenen konular',
    type: [TopicDto],
    example: [
      {
        subTopicName: 'Veritabanı Normalizasyonu',
        normalizedSubTopicName: 'veritabani_normalizasyonu',
      },
      {
        subTopicName: 'ORM Teknolojileri',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicDto)
  topics: TopicDto[];
}
