import { LoggerService } from '../services/logger.service';

/**
 * Kullanıcı rolleri için sabitler
 */
export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  GUEST = 'guest',
  USER = 'user',
  INSTRUCTOR = 'instructor',
}

/**
 * Rol listesini döndürür
 * @returns Tüm rollerin listesi
 */
export function getAllRoles(): string[] {
  try {
    const logger = LoggerService.getInstance();
    logger.debug(
      'getAllRoles fonksiyonu çağrıldı',
      'roles.constants.getAllRoles',
      __filename,
      14,
    );

    return Object.values(Role);
  } catch (error) {
    const logger = LoggerService.getInstance();
    logger.logError(error, 'roles.constants.getAllRoles');
    return [];
  }
}

/**
 * Roller için yetki seviyelerini tanımlar
 */
export const ROLE_PERMISSIONS = {
  [Role.USER]: 1,
  [Role.INSTRUCTOR]: 2,
  [Role.ADMIN]: 10,
};
