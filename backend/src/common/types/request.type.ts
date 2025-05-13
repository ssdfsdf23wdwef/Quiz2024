import { Request } from 'express';

/**
 * Kimlik bilgisine sahip istek
 */
export interface RequestWithUser extends Request {
  user: {
    id: string;
    uid: string;
    email: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string | null;
    role?: 'USER' | 'ADMIN';
    createdAt?: string | Date;
    lastLogin?: string | Date;
    firebaseUser?: any; // Firebase kullanıcı nesnesi
  };
}

/**
 * Sayfalama parametreleri
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Filtreleme parametreleri
 */
export interface FilterParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  difficulty?: string;
  [key: string]: any;
}
