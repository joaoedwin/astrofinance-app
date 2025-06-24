import { API_BASE_URL } from './config/api';

/**
 * Cliente para fazer requisições à API AstroFinance
 */

// Tipos para as opções de requisição
interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

// Função para obter o token JWT do localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Função para fazer requisições à API
export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const { params, ...fetchOptions } = options;
  
  // Construir URL com parâmetros de consulta
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
  }
  
  // Obter token de autenticação
  const token = getToken();
  
  // Configurar headers
  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  console.log(`[API Client] Fazendo requisição para: ${url}`);
  console.log(`[API Client] Método: ${fetchOptions.method || 'GET'}`);
  console.log(`[API Client] Token presente: ${token ? 'Sim' : 'Não'}`);
  
  try {
    // Fazer a requisição
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // Incluir cookies na requisição
    });
    
    // Verificar se a resposta é bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Client] Erro na resposta: ${response.status}`, errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
      } catch (e) {
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }
    }
    
    // Retornar dados da resposta
    const data = await response.json();
    console.log(`[API Client] Resposta recebida:`, data);
    return data;
  } catch (error) {
    console.error(`[API Client] Erro ao fazer requisição:`, error);
    throw error;
  }
};

// Métodos de conveniência para diferentes tipos de requisições
export const apiClient = {
  get: <T = any>(endpoint: string, options: RequestOptions = {}) => 
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T = any>(endpoint: string, data?: any, options: RequestOptions = {}) => 
    apiFetch<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  put: <T = any>(endpoint: string, data?: any, options: RequestOptions = {}) => 
    apiFetch<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
    
  delete: <T = any>(endpoint: string, options: RequestOptions = {}) => 
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}; 