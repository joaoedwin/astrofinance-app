import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/register", "/", "/api/auth"]

// Rotas que são redirecionadas para a página de login se não houver autenticação
const protectedRoutes = [
  "/dashboard", 
  "/transactions", 
  "/categories", 
  "/goals", 
  "/reports", 
  "/settings",
  "/credit-cards",
  "/installments"
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se a rota é pública
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Verificar se a rota é protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Verificar token nos cookies
  const token = request.cookies.get("token")?.value
  
  // Se não houver token, redirecionar para a página de login
  if (!token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  // Continuar para a página - a autenticação será verificada no lado do cliente
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
} 