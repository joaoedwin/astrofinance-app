/**
 * Configuração global para rotas de API
 * 
 * Este arquivo contém configurações que são aplicadas a todas as rotas de API
 * para garantir que elas funcionem corretamente no ambiente de produção.
 */

// Forçar renderização dinâmica para todas as rotas de API
export const dynamic = 'force-dynamic';

// Configurar tempo de resposta máximo
export const fetchCache = 'force-no-store';

// Desativar o cache de resposta
export const revalidate = 0;

// Configurar o runtime para Node.js
export const runtime = 'nodejs';

// Exportar funções utilitárias para rotas de API

/**
 * Função para lidar com erros em rotas de API
 */
export function handleApiError(error: unknown, message: string = 'Erro interno do servidor') {
  console.error(`[API Error] ${message}:`, error);
  return Response.json(
    { error: message, details: error instanceof Error ? error.message : String(error) },
    { status: 500 }
  );
}

/**
 * Função para validar o token de autenticação
 */
export function validateAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remover 'Bearer ' do início
} 