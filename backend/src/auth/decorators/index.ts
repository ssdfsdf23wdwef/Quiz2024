import { LoggerService } from '../../common/services/logger.service';

export * from './public.decorator';
export * from './roles.decorator';

// Log kaydı
try {
  const logger = LoggerService.getInstance();
  logger.debug(
    'Auth decorators index yükleniyor',
    'auth.decorators.index',
    __filename,
    7,
  );
} catch (error) {
  console.error('Decorators index yüklenirken hata:', error);
}
