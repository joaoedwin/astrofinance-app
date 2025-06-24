import { Context, MiddlewareHandler, Next } from 'hono';

/**
 * Middleware para configurar CORS
 */
export const corsMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
  // Configurar cabeçalhos CORS
  c.header('Access-Control-Allow-Origin', 'https://astrofinance-app-tcc8.vercel.app');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400'); // 24 horas

  // Responder imediatamente para requisições OPTIONS
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  await next();
}; 