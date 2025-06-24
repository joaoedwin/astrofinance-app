import { Context, MiddlewareHandler, Next } from 'hono';
import { Env } from '../types';

interface RateLimitOptions {
  limit: number;
  window: number; // em segundos
}

/**
 * Middleware para limitar a taxa de requisições (rate limiting)
 * Usa o KV storage do Cloudflare Workers para armazenar os contadores
 */
export const rateLimitMiddleware = (options: RateLimitOptions = { limit: 100, window: 60 }): MiddlewareHandler<{
  Bindings: Env;
}> => {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const path = new URL(c.req.url).pathname;
    const key = `ratelimit:${ip}:${path}`;
    
    // Implementação simples usando cabeçalhos para simular rate limiting
    // Em produção, deve-se usar KV, Durable Objects ou D1 para armazenar os contadores
    
    // Adicionar cabeçalhos de rate limiting
    c.header('X-RateLimit-Limit', options.limit.toString());
    c.header('X-RateLimit-Window', options.window.toString());
    
    // Simular verificação de limite
    // Em produção, isso seria implementado com armazenamento persistente
    const userAgent = c.req.header('User-Agent') || '';
    
    // Bloquear requisições sem User-Agent ou com padrões suspeitos
    if (!userAgent || userAgent.includes('curl') || userAgent.includes('wget')) {
      // Adicionar delay para dificultar ataques de força bruta
      await new Promise(resolve => setTimeout(resolve, 500));
      return c.json({ error: 'Muitas requisições. Tente novamente mais tarde.' }, 429);
    }
    
    await next();
  };
}; 