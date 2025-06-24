import { apiClient } from './api-client';
import { API_ENDPOINTS } from './config/api';

export interface Category {
  id: string
  name: string
  type: "income" | "expense"
  color: string
  icon: string
  user_id?: string
}

export async function getCategories(type?: "income" | "expense"): Promise<Category[]> {
  const params: Record<string, string> = {};
  if (type) {
    params.type = type;
  }

  return apiClient.get<Category[]>(API_ENDPOINTS.CATEGORIES.BASE, { params });
}

export async function createCategory(
  data: { name: string; type: "income" | "expense"; color?: string; icon?: string }
): Promise<Category> {
  return apiClient.post<Category>(API_ENDPOINTS.CATEGORIES.BASE, data);
}

export async function updateCategory(
  id: string,
  data: { name?: string; color?: string; icon?: string }
): Promise<Category> {
  return apiClient.put<Category>(API_ENDPOINTS.CATEGORIES.DETAIL(id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  return apiClient.delete(API_ENDPOINTS.CATEGORIES.DETAIL(id));
}

export async function getCategoryById(id: string): Promise<Category> {
  return apiClient.get<Category>(API_ENDPOINTS.CATEGORIES.DETAIL(id));
} 