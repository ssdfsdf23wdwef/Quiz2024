import { LoggerService } from '../../common/services/logger.service';

export * from './login.dto';
export * from './register.dto';
export * from './refresh-token.dto';
export * from './google-login.dto';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug('Auth DTO index yükleniyor', 'auth.dto.index', __filename, 10);
} catch (error) {
  console.error('DTO index yüklenirken hata:', error);
}
