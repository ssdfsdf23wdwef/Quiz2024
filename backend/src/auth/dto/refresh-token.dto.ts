import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Refresh Token DTO yükleniyor',
    'refresh-token.dto',
    __filename,
    9,
  );
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "Kimlik yenileme token'i",
    example: 'refresh_token_id',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
