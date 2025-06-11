import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/register"]

export function middleware(request: NextRequest) {
  // Verificar se a rota é pública
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar tokens nos cookies e localStorage
  const token = request.cookies.get("token")?.value || 
                request.cookies.get("jwt")?.value

  // Se não houver token nos cookies, verificar o Authorization header
  // que pode vir de localStorage via fetch
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const headerToken = authHeader.substring(7)
      
      // Armazenar o token como cookie para futuras requisições
      const response = NextResponse.next()
      response.cookies.set("token", headerToken, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/"
      })
      
      return response
    }
  }

  // Continuar para a página - a autenticação será verificada no lado do cliente ou do servidor
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
} 