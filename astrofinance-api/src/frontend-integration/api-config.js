/**
 * Configuração da API para o Frontend
 * 
 * Instruções para integração com o frontend:
 * 
 * 1. No seu projeto frontend, crie um arquivo de configuração (config.js ou .env) com a URL base da API:
 *    API_BASE_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api"
 * 
 * 2. Atualize todas as chamadas de API para usar esta URL base, por exemplo:
 *    - De: fetch('/api/auth/login', ...)
 *    - Para: fetch(`${API_BASE_URL}/auth/login`, ...)
 * 
 * 3. Certifique-se de incluir o token de autenticação em todas as requisições protegidas:
 *    ```
 *    fetch(`${API_BASE_URL}/transactions`, {
 *      headers: {
 *        'Authorization': `Bearer ${token}`,
 *        'Content-Type': 'application/json'
 *      }
 *    })
 *    ```
 * 
 * 4. Para facilitar, você pode criar um helper de fetch que já inclui a URL base e o token:
 *    ```
 *    const apiFetch = (endpoint, options = {}) => {
 *      const token = localStorage.getItem('token');
 *      
 *      return fetch(`${API_BASE_URL}${endpoint}`, {
 *        ...options,
 *        headers: {
 *          ...options.headers,
 *          'Authorization': token ? `Bearer ${token}` : '',
 *          'Content-Type': 'application/json'
 *        }
 *      });
 *    }
 *    
 *    // Uso:
 *    apiFetch('/transactions').then(res => res.json())
 *    ```
 */

/**
 * Mapeamento completo dos endpoints da API
 */
const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    REGISTER: '/auth/register',        // POST - Registrar novo usuário
    LOGIN: '/auth/login',              // POST - Login de usuário
    REFRESH: '/auth/refresh',          // POST - Atualizar token
    ME: '/auth/me',                    // GET - Obter dados do usuário logado
  },
  
  // Categorias
  CATEGORIES: {
    BASE: '/categories',               // GET - Listar categorias, POST - Criar categoria
    DETAIL: (id) => `/categories/${id}` // GET - Obter categoria, PUT - Atualizar categoria, DELETE - Excluir categoria
  },
  
  // Transações
  TRANSACTIONS: {
    BASE: '/transactions',             // GET - Listar transações, POST - Criar transação
    DETAIL: (id) => `/transactions/${id}`, // GET - Obter transação, PUT - Atualizar transação, DELETE - Excluir transação
    SUMMARY: '/transactions/summary'   // GET - Obter resumo de transações
  },
  
  // Parcelamentos
  INSTALLMENTS: {
    BASE: '/installments',             // GET - Listar parcelamentos, POST - Criar parcelamento
    DETAIL: (id) => `/installments/${id}` // GET - Obter parcelamento, PUT - Atualizar parcelamento, DELETE - Excluir parcelamento
  },
  
  // Cartões de Crédito
  CREDIT_CARDS: {
    BASE: '/credit-cards',             // GET - Listar cartões, POST - Criar cartão
    DETAIL: (id) => `/credit-cards/${id}` // GET - Obter cartão, PUT - Atualizar cartão, DELETE - Excluir cartão
  },
  
  // Metas
  GOALS: {
    BASE: '/goals',                    // GET - Listar metas, POST - Criar meta
    DETAIL: (id) => `/goals/${id}`,    // GET - Obter meta, PUT - Atualizar meta, DELETE - Excluir meta
    RESERVES: (id) => `/goals/${id}/reserves`, // GET - Listar reservas, POST - Criar reserva
    RESERVE_DETAIL: (goalId, reserveId) => `/goals/${goalId}/reserves/${reserveId}` // DELETE - Excluir reserva
  },
  
  // Notificações
  NOTIFICATIONS: {
    BASE: '/notifications',            // GET - Listar notificações, POST (admin) - Criar notificação
    DETAIL: (id) => `/notifications/${id}`, // PUT - Marcar como lida, DELETE - Excluir notificação
    READ_ALL: '/notifications/read-all' // PUT - Marcar todas como lidas
  }
};

export default API_ENDPOINTS; 