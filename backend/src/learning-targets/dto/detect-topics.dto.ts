import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class DetectTopicsDto {
  @ApiProperty({
    description: 'Belge metni (Opsiyonel: Belge ID varsa gerekli değildir)',
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentText?: string;

  @ApiProperty({
    description: 'Ders ID (Hızlı Sınav için opsiyonel)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Belge ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentId?: string;
}
