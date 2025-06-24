import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { cookies } from "next/headers"

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.JWT_SECRET) {
  console.error('AVISO: JWT_SECRET não está definido nas variáveis de ambiente. Usando valor padrão (inseguro para produção).')
}

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const month = url.searchParams.get("month")
    const year = url.searchParams.get("year")

    // Validar parâmetros
    if (!month || !year || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
      return NextResponse.json(
        { error: "Mês e ano são obrigatórios e devem ser numéricos" },
        { status: 400 }
      )
    }

    // Validar formato do mês (1-12)
    const monthNum = parseInt(month)
    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: "Mês deve estar entre 1 e 12" },
        { status: 400 }
      )
    }

    // Tentar obter token do cabeçalho de autorização
    let token = request.headers.get("Authorization")?.split(" ")[1]
    
    // Se não encontrar, tentar obter dos cookies
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get("token")?.value
    }

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    // Verificar token JWT
    let userId: string
    try {
      const decoded = verify(token, JWT_SECRET) as { userId: string }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    // Verificar se o usuário existe
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    console.log(`Parâmetros recebidos: { userId: '${userId}', month: '${month}', year: '${year}' }`)

    const db = getDatabase()
    
    // Construir filtro de data para o mês selecionado
    const monthPadded = monthNum.toString().padStart(2, '0')
    const startDate = `${year}-${monthPadded}-01` // Primeiro dia do mês
    
    // Último dia do mês (considerando meses com diferentes números de dias)
    const lastDay = new Date(parseInt(year), monthNum, 0).getDate()
    const endDate = `${year}-${monthPadded}-${lastDay}` // Último dia do mês

    // Obter transações com filtro por mês
    const transactions = db.prepare(`
      SELECT t.*, c.name as category 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = ? 
      AND (
        (t.date BETWEEN ? AND ?) 
        OR (substr(t.date, 1, 7) = ?)
      )
      ORDER BY t.date DESC
    `).all(userId, startDate, endDate, `${year}-${monthPadded}`)

    console.log(`Transações do usuário:`, transactions)

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("[API] Erro ao buscar transações por mês:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    )
  }
} 