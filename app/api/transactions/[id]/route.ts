import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
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

// GET /api/transactions/[id] - Obter uma transação específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
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

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido" },
        { status: 400 }
      )
    }

    const db = getDatabase()
    
    // Obter a transação com verificação de propriedade
    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `).get(transactionId, userId)

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada ou não pertence ao usuário" },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("[API] Erro ao buscar transação:", error)
    return NextResponse.json(
      { error: "Erro ao buscar transação" },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id] - Atualizar uma transação
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
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

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { amount, date, description, type, categoryId, category_id } = body

    // Validação de campos - Aceitar category_id ou categoryId
    const categoryIdValue = categoryId || category_id
    if (!amount || !date || !description || !type || !categoryIdValue) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar tipo
    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: "Tipo deve ser 'income' ou 'expense'" },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = db.prepare(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ?"
    ).get(transactionId, userId)

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transação não encontrada ou não pertence ao usuário" },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe e pertence ao usuário
    const category = db.prepare(
      "SELECT * FROM categories WHERE id = ? AND user_id = ?"
    ).get(categoryIdValue, userId)

    if (!category) {
      return NextResponse.json(
        { error: "Categoria não encontrada ou não pertence ao usuário" },
        { status: 400 }
      )
    }

    // Atualizar a transação
    db.prepare(`
      UPDATE transactions 
      SET date = ?, description = ?, amount = ?, type = ?, category_id = ? 
      WHERE id = ? AND user_id = ?
    `).run(date, description, amount, type, categoryIdValue, transactionId, userId)

    // Buscar a transação atualizada
    const updatedTransaction = db.prepare(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(transactionId)

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error("[API] Erro ao atualizar transação:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar transação" },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Excluir uma transação
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const token = request.headers.get("Authorization")?.split(" ")[1]
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

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json(
        { error: "ID da transação não fornecido" },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = db.prepare(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ?"
    ).get(transactionId, userId)

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transação não encontrada ou não pertence ao usuário" },
        { status: 404 }
      )
    }

    // Excluir a transação
    db.prepare(
      "DELETE FROM transactions WHERE id = ? AND user_id = ?"
    ).run(transactionId, userId)

    return NextResponse.json(
      { message: "Transação excluída com sucesso" },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API] Erro ao excluir transação:", error)
    return NextResponse.json(
      { error: "Erro ao excluir transação" },
      { status: 500 }
    )
  }
} 