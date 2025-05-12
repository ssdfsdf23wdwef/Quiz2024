import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class DetectTopicsDto {
  @ApiProperty({
    description: 'Belge metni',
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
  })
  @IsString()
  @IsNotEmpty()
  documentText: string;

  @ApiProperty({
    description: 'Ders ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
