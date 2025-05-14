import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

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

  @ApiProperty({
    description: 'Belge ID',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  @IsString()
  @IsOptional()
  documentId?: string;
}
