/**
 * Configuração global para layouts da aplicação
 * 
 * Este arquivo contém configurações que são aplicadas a todos os layouts
 * para garantir que eles funcionem corretamente no ambiente de produção.
 */

// Forçar renderização dinâmica para todos os layouts
export const dynamic = 'force-dynamic';

// Configurar tempo de resposta máximo
export const fetchCache = 'force-no-store';

// Desativar o cache de resposta
export const revalidate = 0;

// Configurar o runtime para Node.js
export const runtime = 'nodejs'; 