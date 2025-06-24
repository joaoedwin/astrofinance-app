import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env, Variables } from './types';
import { authMiddleware } from './middleware/auth';
import { corsMiddleware } from './middleware/cors';
import { rateLimitMiddleware } from './middleware/rate-limit';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import transactionsRouter from './routes/transactions';
import installmentsRouter from './routes/installments';
import creditCardsRouter from './routes/credit-cards';
import goalsRouter from './routes/goals';
import notificationsRouter from './routes/notifications';
import reportsRouter from './routes/reports';
import { initDbHandler } from './scripts/init-db';

// Criar a aplicação Hono
const app = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware CORS
app.use('*', corsMiddleware);

// Adicionar cabeçalhos de segurança
app.use('*', async (c, next) => {
  // Cabeçalhos de segurança
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  await next();
});

// Aplicar rate limiting global
const globalRateLimit = rateLimitMiddleware({ limit: 300, window: 60 }); // 300 requisições por minuto
app.use('*', globalRateLimit);

// Configurar rotas
app.route('/api/auth', authRouter);
app.route('/api/categories', categoriesRouter);
app.route('/api/transactions', transactionsRouter);
app.route('/api/installments', installmentsRouter);
app.route('/api/credit-cards', creditCardsRouter);
app.route('/api/goals', goalsRouter);
app.route('/api/notifications', notificationsRouter);
app.route('/api/reports', reportsRouter);

// Rota para verificar se a API está funcionando
app.get('/', (c) => {
  return c.json({
    message: 'AstroFinance API está funcionando!',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/categories',
      '/api/transactions',
      '/api/installments',
      '/api/credit-cards',
      '/api/goals',
      '/api/notifications',
      '/api/reports'
    ]
  });
});

// Rota para inicializar o banco de dados (somente para uso em desenvolvimento)
app.get('/api/init-db', async (c) => {
  // Esta rota deve ser protegida em produção ou removida
  // Idealmente, a inicialização do banco deve ser feita via script de deploy
  const result = await initDbHandler(c.env.DB);
  return c.json(result);
});

// Rota para verificar o status da API
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || 'production'
  });
});

// Exportar a aplicação para o Cloudflare Workers
export default app; 