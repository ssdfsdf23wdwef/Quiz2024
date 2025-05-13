// frontend/src/constants/api.constants.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  COURSES: '/courses',
  USERS: '/users',
  // İhtiyaç duydukça daha fazla endpoint ekleyin
};

export const DEFAULT_TIMEOUT = 10000; // 10 saniye 