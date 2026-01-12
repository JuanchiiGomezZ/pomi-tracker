export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type OnboardingStatus = 'NAME' | 'BLOCKS' | 'COMPLETE';

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  organizationId: string | null;
  onboardingStatus: OnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
