import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoggerService } from '../../common/services/logger.service';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Register DTO yükleniyor', 'register.dto', __filename, 14);
} catch (error) {
  console.error('DTO yüklenirken hata:', error);
}

export class RegisterDto {
  @ApiProperty({
    description: 'Kullanıcı e-posta adresi',
    example: 'kullanici@example.com',
  })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  @IsNotEmpty({ message: 'E-posta adresi zorunludur' })
  email: string;

  @ApiProperty({
    description:
      'Kullanıcı şifresi (en az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam)',
    example: 'Sifre123',
    minLength: 8,
  })
  @IsString({ message: 'Şifre metin formatında olmalıdır' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/, {
    message: 'Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
  })
  @IsNotEmpty({ message: 'Şifre zorunludur' })
  password: string;

  @ApiProperty({
    description: 'Kullanıcının adı',
    example: 'Ahmet',
    required: false,
  })
  @IsString({ message: 'Ad metin formatında olmalıdır' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Kullanıcının soyadı',
    example: 'Yılmaz',
    required: false,
  })
  @IsString({ message: 'Soyad metin formatında olmalıdır' })
  @IsOptional()
  lastName?: string;
}
