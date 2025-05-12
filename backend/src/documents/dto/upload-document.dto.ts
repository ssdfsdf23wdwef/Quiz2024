import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Yüklenecek belge için ders ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsString({ message: 'Ders ID metin formatında olmalıdır' })
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Yüklenecek belgenin dosya adı',
    example: 'ders-notu.pdf',
    required: false,
  })
  @IsString({ message: 'Dosya adı metin formatında olmalıdır' })
  @IsOptional()
  fileName?: string;

  @ApiProperty({
    description: 'Yüklenecek belgenin boyutu (byte)',
    example: 1024,
    required: false,
  })
  @IsNumber({}, { message: 'Dosya boyutu sayı formatında olmalıdır' })
  @IsOptional()
  fileSize?: number;

  // Actual file will be handled via multipart/form-data
  // No need to define it here, NestJS's FileInterceptor handles it
}
