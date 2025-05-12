import * as admin from 'firebase-admin'; // Timestamp için

export interface UserRefreshToken {
  id?: string; // Firestore document ID
  userId: string;
  hashedToken: string;
  expiresAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  ipAddress?: string;
  userAgent?: string;
}
