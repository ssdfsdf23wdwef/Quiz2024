import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Google Login DTO yükleniyor',
    'google-login.dto',
    __filename,
    9,
  );
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google Authentication ile alınan ID token',
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOTczZWUwZTE2ZjdlZWY4NDEyNTRjZDFhOGEyNzRmOTAyYTNlMTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20veW91ci1maXJlYmFzZS1wcm9qZWN0LWlkIiwiYXVkIjoieW91ci1maXJlYmFzZS1wcm9qZWN0LWlkIiwiYXV0aF90aW1lIjoxNjUxMjM0NTY3LCJ1c2VyX2lkIjoiZ29vZ2xlLW9hdXRoMnwxMTg3OTc0MDcxNDciLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExODc5NzQwNzE0NyIsImlhdCI6MTY1MTIzNDU2NywiZXhwIjoxNjUzODI2NTY3LCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExODc5NzQwNzE0NyJdLCJlbWFpbCI6WyJ1c2VyQGV4YW1wbGUuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoiZ29vZ2xlLmNvbSJ9fQ.VJ8Q8i6dXn5yGpz8riK_NRvJJ5g96QkDrRXyDbJk2PqM1CDkGN_PCXmNJiKARlPA9cKW1UyDLmMAGo-Xpw7eHVjTOuKFLnl8RL-IjTzrTCftQvVZEOFW-MOgzrWY77rw7o3ZUsA8i_sCfNDSzSsKa6DCZGYyhr40YXUkUkxCKCQ',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
