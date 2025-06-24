import { NextRequest, NextResponse } from 'next/server';

// Estender o tipo NextRequest para incluir propriedades personalizadas
declare module 'next/server' {
  interface NextRequest {
    // Adicionar propriedades personalizadas se necessário
  }

  interface NextResponse {
    // Adicionar propriedades personalizadas se necessário
  }
}

// Definir tipos para rotas de API
declare namespace API {
  // Tipo para respostas de erro
  interface ErrorResponse {
    error: string;
    details?: string;
    status?: number;
  }

  // Tipo para respostas de sucesso
  interface SuccessResponse<T = any> {
    success: true;
    data: T;
  }

  // Tipo para respostas de autenticação
  interface AuthResponse {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }
} 