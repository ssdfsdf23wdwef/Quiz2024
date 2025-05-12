import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Login DTO yükleniyor', 'login.dto', __filename, 11);
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

export class LoginDto {
  @ApiProperty({
    description: 'Kullanıcı e-posta adresi',
    example: 'kullanici@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Kullanıcı şifresi',
    example: 'sifre123',
    required: false,
  })
  @IsString({ message: 'Şifre metin formatında olmalıdır' })
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Firebase Authentication tarafından sağlanan ID token',
    example:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOTczZWUwZTE2ZjdlZWY4NDEyNTRjZDFhOGEyNzRmOTAyYTNlMTYiLCJ0eXAiOiJKV1QifQ...',
    required: true,
  })
  @IsString({ message: 'ID token metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'ID token zorunludur' })
  idToken: string;
}
