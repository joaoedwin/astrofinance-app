import { NextResponse } from "next/server"
import { getDatabase, randomUUID } from "@/lib/db"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"

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

interface CountResult {
  total: number
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    
    const db = getDatabase()
    const transactions = db.prepare(`
      SELECT t.*, c.name as category 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = ? 
      ORDER BY date DESC
    `).all(user.id)
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error("[API] Erro ao buscar transações:", error)
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validação do formato do corpo da requisição
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: "Corpo da requisição inválido" },
        { status: 400 }
      )
    }
    
    const { amount, date, description, type, categoryId } = body
    
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    // Validação mais rigorosa de campos obrigatórios
    const requiredFields = { amount, date, description, type, categoryId };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === '')
      .map(([key]) => key);
      
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validação de tipo de dados e valores
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "O valor deve ser um número positivo" },
        { status: 400 }
      )
    }
    
    // Validar formato de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (typeof date !== 'string' || !dateRegex.test(date) || isNaN(Date.parse(date))) {
      return NextResponse.json(
        { error: "Data inválida. Use o formato YYYY-MM-DD" },
        { status: 400 }
      )
    }
    
    // Validar descrição
    if (typeof description !== 'string' || description.trim().length < 3 || description.length > 200) {
      return NextResponse.json(
        { error: "A descrição deve ter entre 3 e 200 caracteres" },
        { status: 400 }
      )
    }
    
    // Validar tipo de transação
    if (typeof type !== 'string' || !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: "Tipo de transação deve ser 'income' ou 'expense'" },
        { status: 400 }
      )
    }
    
    // Validar ID da categoria
    if (typeof categoryId !== 'string' || !categoryId.trim()) {
      return NextResponse.json(
        { error: "ID da categoria inválido" },
        { status: 400 }
      )
    }
    
    // Sanitização de dados
    const sanitizedDescription = description.trim();

    const db = getDatabase()

    // Verificar se a categoria pertence ao usuário
    const category = db.prepare(
      "SELECT * FROM categories WHERE id = ? AND user_id = ?"
    ).get(categoryId, user.id)

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada ou não pertence ao usuário" },
        { status: 400 }
      )
    }

    const id = randomUUID()

    console.log("[API] Inserindo transação:", {
      id,
      userId: user.id,
      date,
      description: sanitizedDescription,
      amount,
      type,
      categoryId
    })

    db.prepare(
      "INSERT INTO transactions (id, date, description, amount, type, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, date, sanitizedDescription, amount, type, categoryId, user.id)

    const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)
    console.log("[API] Transação inserida no banco:", transaction)

    // Verificar se a transação foi efetivamente inserida
    if (!transaction) {
      console.error("[API] Transação não foi inserida no banco")
      return NextResponse.json({ error: "Erro ao inserir transação no banco" }, { status: 500 })
    }

    // Contar quantas transações o usuário tem no total para verificação
    const count = db.prepare("SELECT COUNT(*) as total FROM transactions WHERE user_id = ?").get(user.id) as CountResult
    console.log(`[API] Total de transações para o usuário ${user.id}: ${count.total}`)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("[API] Erro ao criar transação:", error)
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 })
  }
} 