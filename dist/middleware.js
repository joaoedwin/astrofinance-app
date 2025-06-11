"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const server_1 = require("next/server");
// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/register"];
function middleware(request) {
    // Verificar se a rota é pública
    if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        return server_1.NextResponse.next();
    }
    // Verificar tokens nos cookies e localStorage
    const token = request.cookies.get("token")?.value ||
        request.cookies.get("jwt")?.value;
    // Se não houver token nos cookies, verificar o Authorization header
    // que pode vir de localStorage via fetch
    if (!token) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const headerToken = authHeader.substring(7);
            // Armazenar o token como cookie para futuras requisições
            const response = server_1.NextResponse.next();
            response.cookies.set("token", headerToken, {
                httpOnly: true,
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 7, // 7 dias
                path: "/"
            });
            return response;
        }
    }
    // Continuar para a página - a autenticação será verificada no lado do cliente ou do servidor
    return server_1.NextResponse.next();
}
exports.config = {
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
};
