export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/';

export const STORAGE_KEYS = {
  USER: 'user',
  THEME: 'app_theme',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
