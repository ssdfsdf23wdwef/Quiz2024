import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DetectNewTopicsDto {
  @ApiProperty({
    description: 'Kurs ID (opsiyonel, eğer konu tespiti bir ders bağlamında yapılıyorsa)',
    required: false
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Mevcut, bilinen konu başlıkları listesi',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  existingTopicTexts: string[];

  @ApiProperty({
    description: 'Eğer courseId yoksa, genel bir metin girdisi',
    required: false
  })
  @IsString()
  @IsOptional()
  contextText?: string;
}
