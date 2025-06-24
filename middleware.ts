import { NextRequest, NextResponse } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = ['/', '/login', '/register'];

// Rotas de API que não precisam de autenticação
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Log para depuração
  console.log(`[Middleware] Processando requisição para: ${pathname}`);

  // Permitir requisições OPTIONS para CORS
  if (request.method === 'OPTIONS') {
    console.log('[Middleware] Requisição OPTIONS detectada, permitindo CORS');
    return handleCors(request);
  }

  // Verificar se é uma rota pública
  if (publicRoutes.some(route => pathname === route) || 
      publicApiRoutes.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Rota pública, permitindo acesso');
    return handleCors(request);
  }

  // Verificar token de autenticação
  try {
    const token = request.cookies.get('token')?.value;
    console.log(`[Middleware] Token encontrado: ${token ? 'sim' : 'não'}`);
    
    if (!token) {
      console.log('[Middleware] Token não encontrado, redirecionando para login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // No Edge Runtime, não podemos verificar o token com JWT
    // Apenas verificamos se o token existe
    console.log('[Middleware] Token existe, permitindo acesso');
    return handleCors(request);
  } catch (error) {
    console.error('[Middleware] Erro ao verificar token:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

// Função para adicionar headers CORS
function handleCors(request: NextRequest) {
  const response = NextResponse.next();
  
  // Adicionar headers CORS
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  return response;
}

// Configurar para quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 