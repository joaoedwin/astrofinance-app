/**
 * API Configuration
 * 
 * Este arquivo contém a configuração da API AstroFinance
 */

// URL base da API - usando o proxy configurado no Next.js
export const API_BASE_URL = "/api";

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    REGISTER: '/auth/register',        // POST - Registrar novo usuário
    LOGIN: '/auth/login',              // POST - Login de usuário
    REFRESH: '/auth/refresh',          // POST - Atualizar token
    ME: '/auth/me',                    // GET - Obter dados do usuário logado
    CHANGE_PASSWORD: '/auth/change-password', // POST - Alterar senha
  },
  
  // Categorias
  CATEGORIES: {
    BASE: '/categories',               // GET - Listar categorias, POST - Criar categoria
    DETAIL: (id: string) => `/categories/${id}` // GET - Obter categoria, PUT - Atualizar categoria, DELETE - Excluir categoria
  },
  
  // Transações
  TRANSACTIONS: {
    BASE: '/transactions',             // GET - Listar transações, POST - Criar transação
    DETAIL: (id: string) => `/transactions/${id}`, // GET - Obter transação, PUT - Atualizar transação, DELETE - Excluir transação
    SUMMARY: '/transactions/summary'   // GET - Obter resumo de transações
  },
  
  // Parcelamentos
  INSTALLMENTS: {
    BASE: '/installments',             // GET - Listar parcelamentos, POST - Criar parcelamento
    DETAIL: (id: string) => `/installments/${id}` // GET - Obter parcelamento, PUT - Atualizar parcelamento, DELETE - Excluir parcelamento
  },
  
  // Cartões de Crédito
  CREDIT_CARDS: {
    BASE: '/credit-cards',             // GET - Listar cartões, POST - Criar cartão
    DETAIL: (id: string) => `/credit-cards/${id}` // GET - Obter cartão, PUT - Atualizar cartão, DELETE - Excluir cartão
  },
  
  // Metas
  GOALS: {
    BASE: '/goals',                    // GET - Listar metas, POST - Criar meta
    DETAIL: (id: string) => `/goals/${id}`,    // GET - Obter meta, PUT - Atualizar meta, DELETE - Excluir meta
    RESERVES: (id: string) => `/goals/${id}/reserves`, // GET - Listar reservas, POST - Criar reserva
    RESERVE_DETAIL: (goalId: string, reserveId: string) => `/goals/${goalId}/reserves/${reserveId}` // DELETE - Excluir reserva
  },
  
  // Notificações
  NOTIFICATIONS: {
    BASE: '/notifications',            // GET - Listar notificações, POST (admin) - Criar notificação
    DETAIL: (id: string) => `/notifications/${id}`, // PUT - Marcar como lida, DELETE - Excluir notificação
    READ_ALL: '/notifications/read-all' // PUT - Marcar todas como lidas
  },
  
  // Relatórios
  REPORTS: {
    MONTHLY: '/reports/monthly',
    BY_CATEGORY: '/reports/by-category',
    CASH_FLOW: '/reports/cash-flow',
    GOALS: '/reports/goals'
  }
}; 