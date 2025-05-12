import { LoggerService } from '../../common/services/logger.service';

export * from './jwt-auth.guard';
export * from './role.guard';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Auth guards index yükleniyor',
    'auth.guards.index',
    __filename,
    7,
  );
} catch (error) {
  console.error('Guards index yüklenirken hata:', error);
}
