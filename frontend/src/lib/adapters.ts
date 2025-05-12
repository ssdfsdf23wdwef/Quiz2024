/**
 * Backend ve frontend arasındaki veri dönüşümleri için yardımcı fonksiyonlar
 */

import { User } from "@/types";

/**
 * Backend'den gelen kullanıcı verisini frontend tipine dönüştürür
 * (Date tipindeki tarih alanlarını ISO string'e çevirir)
 */
export function adaptUserFromBackend(backendUser: any): User {
  return {
    ...backendUser,
    // Date nesnelerini ISO string'e dönüştür
    createdAt:
      backendUser.createdAt instanceof Date
        ? backendUser.createdAt.toISOString()
        : backendUser.createdAt,
    updatedAt:
      backendUser.updatedAt instanceof Date
        ? backendUser.updatedAt.toISOString()
        : backendUser.updatedAt,
    lastLogin:
      backendUser.lastLogin instanceof Date
        ? backendUser.lastLogin.toISOString()
        : backendUser.lastLogin,
  };
}

/**
 * Frontend'den backend'e gönderilecek kullanıcı verisini dönüştürür
 * (ISO string tarihleri Date nesnesine çevirir)
 */
export function adaptUserToBackend(frontendUser: Partial<User>): any {
  const backendUser = { ...frontendUser };

  // ISO string'leri Date nesnelerine dönüştürme özelliği gerekirse burada işlenebilir
  // Bu genellikle backend tarafında otomatik olarak yapılır ama gerekirse eklenebilir

  return backendUser;
}
