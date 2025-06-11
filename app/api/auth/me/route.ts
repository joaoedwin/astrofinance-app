import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { cookies } from "next/headers"

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.JWT_SECRET) {
  console.error('AVISO: JWT_SECRET não está definido nas variáveis de ambiente. Usando valor padrão (inseguro para produção).')
}

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

export async function GET(request: Request) {
  try {
    // Tentar obter token do cabeçalho de autorização
    let token = request.headers.get("Authorization")?.split(" ")[1]
    
    // Se não encontrar, tentar obter dos cookies
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get("token")?.value
    }

    if (!token) {
      console.log("[API] /me - Token não fornecido")
      return NextResponse.json(
        { message: "Token não fornecido" },
        { status: 401 }
      )
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const user = await getUserById(decoded.userId)

    if (!user) {
      console.log("[API] /me - Usuário não encontrado")
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    console.log(`[API] /me - Usuário autenticado: ${user.id}`)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[API] /me - Erro ao verificar token:", error)
    return NextResponse.json(
      { message: "Token inválido" },
      { status: 401 }
    )
  }
} 