import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DetectNewTopicsDto {
  @IsNotEmpty()
  @IsString()
  lessonContext: string;

  @IsArray()
  @IsString({ each: true })
  existingTopicNames: string[];
}
