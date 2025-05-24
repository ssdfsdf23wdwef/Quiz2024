import { IsArray, IsNotEmpty, IsString, ArrayNotEmpty } from 'class-validator';

export class ConfirmNewTopicsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  newTopicNames: string[];
}
