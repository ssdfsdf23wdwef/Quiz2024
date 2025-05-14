// Bitirme_Kopya/backend/src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import defaultConfig from './default.config';
// Kullanılmadığı için Joi import'unu şimdilik kaldırıyoruz
// import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Modülün global olarak kullanılabilir olmasını sağlar
      envFilePath: '.env', // Yüklenecek .env dosyasının yolu
      load: [defaultConfig], // Varsayılan yapılandırmayı yükler
      // Validasyonu geçici olarak kaldırıyoruz
      /*validationSchema: Joi.object({
        FIREBASE_PROJECT_ID: Joi.string().required(),
        FIREBASE_PRIVATE_KEY: Joi.string().required(),
        FIREBASE_CLIENT_EMAIL: Joi.string().required(),
        FIREBASE_STORAGE_BUCKET: Joi.string().required(),
      }),*/
      validationOptions: {
        allowUnknown: true, // Bilinmeyen değişkenlere izin ver (önerilmeyebilir, dikkatli kullanın)
        abortEarly: false, // Tüm hataları göster
      },
    }),
  ],
})
export class ConfigModule {}
