/**
 * Configuração global para páginas da aplicação
 * 
 * Este arquivo contém configurações que são aplicadas a todas as páginas
 * para garantir que elas funcionem corretamente no ambiente de produção.
 */

// Forçar renderização dinâmica para todas as páginas
export const dynamic = 'force-dynamic';

// Configurar tempo de resposta máximo
export const fetchCache = 'force-no-store';

// Desativar o cache de resposta
export const revalidate = 0;

// Configurar o runtime para Node.js
export const runtime = 'nodejs';

// Exportar funções utilitárias para páginas

/**
 * Função para lidar com erros em páginas
 */
export function handlePageError(error: unknown, message: string = 'Erro ao carregar a página') {
  console.error(`[PAGE Error] ${message}:`, error);
  return {
    error: message,
    details: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Função para validar o token de autenticação
 */
export function validateAuthToken(token: string | null): boolean {
  return !!token;
} 