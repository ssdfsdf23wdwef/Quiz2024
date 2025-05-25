import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SelectedTopic {
  @ApiProperty({
    description: 'AI tarafından önerilen geçici ID',
  })
  @IsString()
  tempId: string;

  @ApiProperty({
    description: 'Konu adı',
  })
  @IsString()
  name: string;
}

export class ConfirmNewTopicsDto {
  @ApiProperty({
    description: 'Kurs ID (opsiyonel)',
    required: false
  })
  @IsString()
  @IsOptional()
  courseId?: string;

  @ApiProperty({
    description: 'Kullanıcının onayladığı, AI tarafından önerilen konular',
    type: [SelectedTopic],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SelectedTopic)
  selectedTopics: SelectedTopic[];
}
