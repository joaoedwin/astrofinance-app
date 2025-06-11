import type { User } from './database';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokenPayload {
  userId: string;
  iat?: number;
  exp?: number;
} 