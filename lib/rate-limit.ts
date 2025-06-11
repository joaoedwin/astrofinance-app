// Implementação simplificada de rate limiting em memória
// Em produção, considere usar um armazenamento distribuído como Redis

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Limpa periodicamente os registros expirados (a cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime <= now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;     // Janela de tempo em milissegundos
  maxRequests: number;  // Número máximo de requisições na janela
  message?: string;     // Mensagem de erro personalizada
}

export function getRateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = 'Muitas requisições, tente novamente mais tarde' } = options;
  
  return function rateLimitMiddleware(ip: string): { limited: boolean; remainingRequests: number; resetTime: number } {
    const now = Date.now();
    
    // Inicializa o registro para o IP se não existir
    if (!store[ip]) {
      store[ip] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    // Reseta contador se o tempo já passou
    if (store[ip].resetTime <= now) {
      store[ip] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }
    
    // Incrementa contador
    store[ip].count += 1;
    
    // Verifica se está limitado
    const limited = store[ip].count > maxRequests;
    
    return {
      limited,
      remainingRequests: Math.max(0, maxRequests - store[ip].count),
      resetTime: store[ip].resetTime,
    };
  };
}

// Configurações específicas para diferentes endpoints
export const loginRateLimit = getRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  maxRequests: 5,            // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente mais tarde.'
});

export const registerRateLimit = getRateLimitMiddleware({
  windowMs: 60 * 60 * 1000,  // 1 hora
  maxRequests: 3,            // 3 tentativas
  message: 'Muitas tentativas de registro. Tente novamente mais tarde.'
});

export const apiRateLimit = getRateLimitMiddleware({
  windowMs: 60 * 1000,       // 1 minuto
  maxRequests: 30,           // 30 requisições por minuto
  message: 'Muitas requisições à API. Tente novamente mais tarde.'
}); 