/**
 * API Yanıt Tipleri
 * Backend yanıtları için merkezi tip tanımları
 */

import { User } from "./user.type";
import { Course } from "./course.type";
import { LearningTarget } from "./learningTarget.type";
import { Document } from "./document.type";
import { Quiz } from "./quiz.type";

/**
 * Standart API yanıt formatı
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

/**
 * Kimlik doğrulama yanıt tipleri
 */
export interface AuthResponse {
  user: User;
  token: string;
  expiresIn?: number;
}

export interface GoogleAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

/**
 * Kullanıcı API yanıt tipleri
 */
export interface UserProfileResponse {
  id: string;
  uid: string;
  firebaseUid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string | null;
  role: "USER" | "ADMIN";
  onboarded: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastLogin: string | Date;
  settings?: Record<string, any>;
}

/**
 * Kurs API yanıt tipleri
 */
export interface CourseListResponse {
  courses: Course[];
  total: number;
}

export interface CourseDetailResponse {
  course: Course;
  learningTargets: LearningTarget[];
}

/**
 * Belge API yanıt tipleri
 */
export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

/**
 * Sınav API yanıt tipleri
 */
export interface QuizListResponse {
  quizzes: Quiz[];
  total: number;
}
