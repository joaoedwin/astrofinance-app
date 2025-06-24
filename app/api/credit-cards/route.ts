import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface CardCountResult {
  count: number
}

interface InstallmentCountResult {
  count: number
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    const db = getDatabase()
    const cards = db.prepare(
      `SELECT * FROM credit_cards WHERE userId = ? ORDER BY name ASC`
    ).all(user.id)

    return NextResponse.json(cards)
  } catch (error) {
    console.error("Erro ao buscar cartões:", error)
    return NextResponse.json(
      { message: "Erro ao buscar cartões" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    const body = await request.json()
    const { name, color, lastFourDigits } = body

    // Validações de segurança
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Nome é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return NextResponse.json(
        { message: "Cor é obrigatória e deve ser um valor hexadecimal válido" },
        { status: 400 }
      )
    }

    if (lastFourDigits !== null && lastFourDigits !== undefined && 
        (typeof lastFourDigits !== 'string' || !lastFourDigits.match(/^\d{0,4}$/))) {
      return NextResponse.json(
        { message: "Últimos dígitos devem ser um número de até 4 dígitos" },
        { status: 400 }
      )
    }

    // Verificar limite de cartões
    const db = getDatabase()
    const cardCount = db.prepare(
      `SELECT COUNT(*) as count FROM credit_cards WHERE userId = ?`
    ).get(user.id) as CardCountResult

    if (cardCount.count >= 6) {
      return NextResponse.json(
        { message: "Limite de 6 cartões atingido" },
        { status: 400 }
      )
    }

    const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "")
    const now = new Date().toISOString()

    const result = db.prepare(
      `INSERT INTO credit_cards (userId, name, color, lastFourDigits, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(user.id, sanitizedName, color, lastFourDigits || null, now, now)

    const card = db.prepare(
      `SELECT * FROM credit_cards WHERE id = ?`
    ).get(result.lastInsertRowid)

    return NextResponse.json(card)
  } catch (error) {
    console.error("Erro ao criar cartão:", error)
    return NextResponse.json(
      { message: "Erro ao criar cartão" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    const body = await request.json()
    const { id, name, color, lastFourDigits } = body

    // Validações de segurança
    if (!id) {
      return NextResponse.json(
        { message: "ID é obrigatório" },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { message: "Nome é obrigatório e deve ser uma string válida" },
        { status: 400 }
      )
    }

    if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return NextResponse.json(
        { message: "Cor é obrigatória e deve ser um valor hexadecimal válido" },
        { status: 400 }
      )
    }

    if (lastFourDigits !== null && lastFourDigits !== undefined && 
        (typeof lastFourDigits !== 'string' || !lastFourDigits.match(/^\d{0,4}$/))) {
      return NextResponse.json(
        { message: "Últimos dígitos devem ser um número de até 4 dígitos" },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const now = new Date().toISOString()

    const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "")

    db.prepare(
      `UPDATE credit_cards 
       SET name = ?, color = ?, lastFourDigits = ?, updatedAt = ?
       WHERE id = ? AND userId = ?`
    ).run(sanitizedName, color, lastFourDigits || null, now, id, user.id)

    const card = db.prepare(
      `SELECT * FROM credit_cards WHERE id = ? AND userId = ?`
    ).get(id, user.id)

    if (!card) {
      return NextResponse.json(
        { message: "Cartão não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(card)
  } catch (error) {
    console.error("Erro ao atualizar cartão:", error)
    return NextResponse.json(
      { message: "Erro ao atualizar cartão" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { message: "ID do cartão é obrigatório" },
        { status: 400 }
      )
    }

    // Validar formato do ID
    const cardId = parseInt(id);
    if (isNaN(cardId)) {
      return NextResponse.json(
        { message: "ID do cartão inválido" },
        { status: 400 }
      )
    }

    const db = getDatabase()

    // Verificar se o cartão existe e pertence ao usuário
    const card = db.prepare(
      `SELECT * FROM credit_cards WHERE id = ? AND userId = ?`
    ).get(cardId, user.id)

    if (!card) {
      return NextResponse.json(
        { message: "Cartão não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se existem parcelamentos usando este cartão
    const installments = db.prepare(
      `SELECT COUNT(*) as count FROM installments WHERE creditCardId = ?`
    ).get(cardId) as InstallmentCountResult

    if (installments && installments.count > 0) {
      return NextResponse.json(
        { message: "Não é possível excluir um cartão que possui parcelamentos associados" },
        { status: 400 }
      )
    }

    // Excluir o cartão
    db.prepare(
      `DELETE FROM credit_cards WHERE id = ? AND userId = ?`
    ).run(cardId, user.id)

    return NextResponse.json({ message: "Cartão excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir cartão:", error)
    return NextResponse.json(
      { message: "Erro ao excluir cartão" },
      { status: 500 }
    )
  }
} 