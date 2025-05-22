import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
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
}
