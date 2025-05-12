import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { LoggerService } from '../services/logger.service';

const logger = LoggerService.getInstance();
logger.debug(
  'RequestWithUser interface yükleniyor',
  'interfaces.request-with-user',
  __filename,
  6,
);

/**
 * Kullanıcı bilgilerini içeren temel arayüz
 */
export interface User {
  id: string;
  uid: string;
  email: string;
  displayName?: string | null;
  createdAt: Date;
  lastLogin: Date;
  settings?: any;
}

/**
 * Firebase kullanıcı bilgilerini de içeren genişletilmiş kullanıcı arayüzü
 */
export interface PrismaUserWithFirebase extends User {
  firebaseUser: DecodedIdToken;
}

/**
 * Kullanıcı bilgilerini içeren HTTP isteği arayüzü
 */
export interface RequestWithUser extends Request {
  user: PrismaUserWithFirebase;
}
