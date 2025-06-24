import { apiClient } from './api-client';
import { API_ENDPOINTS } from './config/api';

// Interfaces para autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RefreshData {
  refreshToken: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Funções de autenticação
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
  
  // Salvar token no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
  }
  
  return response;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  
  // Salvar token no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
  }
  
  return response;
}

export async function refreshToken(data: RefreshData): Promise<{ token: string; refreshToken: string }> {
  const response = await apiClient.post<{ token: string; refreshToken: string }>(
    API_ENDPOINTS.AUTH.REFRESH,
    data
  );
  
  // Atualizar token no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
  }
  
  return response;
}

export async function logout(): Promise<void> {
  // Remover tokens do localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
}

export async function changePassword(data: ChangePasswordData): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
    data
  );
}

// Função para verificar se o usuário está autenticado
export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
} 