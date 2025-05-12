import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Ders adı',
    example: 'Veri Yapıları ve Algoritmalar',
    maxLength: 100,
  })
  @IsString({ message: 'Ders adı metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Ders adı zorunludur' })
  @MaxLength(100, { message: 'Ders adı en fazla 100 karakter olabilir' })
  name: string;

  @ApiProperty({
    description: 'Ders açıklaması',
    example:
      'Algoritma analizi, veri yapıları ve temel algoritma tasarım teknikleri',
    required: false,
    maxLength: 500,
  })
  @IsString({ message: 'Ders açıklaması metin formatında olmalıdır' })
  @IsOptional()
  @MaxLength(500, { message: 'Ders açıklaması en fazla 500 karakter olabilir' })
  description?: string;
}
