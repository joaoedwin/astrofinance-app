import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { randomUUID } from "crypto"

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json(
        { message: "Token não fornecido" },
        { status: 401 }
      )
    }

    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const db = getDatabase()
    // Buscar parcelamentos do usuário no banco
    const installments = db.prepare(
      `SELECT i.*, c.name as category, cc.name as creditCardName, cc.color as creditCardColor 
       FROM installments i
       JOIN categories c ON i.category_id = c.id
       LEFT JOIN credit_cards cc ON i.creditCardId = cc.id
       WHERE i.userId = ?
       ORDER BY i.nextPaymentDate ASC`
    ).all(user.id)

    return NextResponse.json({ installments })
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar parcelamentos" },
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
    const db = getDatabase()
    const body = await request.json()
    const {
      description,
      categoryId,
      totalAmount,
      installmentAmount,
      totalInstallments,
      paidInstallments,
      startDate,
      nextPaymentDate
    } = body
    const result = db.prepare(
      `INSERT INTO installments (id, userId, description, category_id, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, type, creditCardId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(), user.id, description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, 'expense', body.creditCardId || null
    )
    return NextResponse.json({ id: result.lastInsertRowid })
  } catch (error) {
    console.error("Erro ao criar parcelamento:", error)
    return NextResponse.json({ message: "Erro ao criar parcelamento" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    const db = getDatabase()
    const body = await request.json()
    const {
      id,
      description,
      categoryId,
      totalAmount,
      installmentAmount,
      totalInstallments,
      paidInstallments,
      startDate,
      nextPaymentDate
    } = body
    const result = db.prepare(
      `UPDATE installments SET description = ?, category_id = ?, totalAmount = ?, installmentAmount = ?, totalInstallments = ?, paidInstallments = ?, startDate = ?, nextPaymentDate = ?, type = ?, creditCardId = ? WHERE id = ? AND userId = ?`
    ).run(
      description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, 'expense', body.creditCardId || null, id, user.id
    )
    return NextResponse.json({ changes: result.changes })
  } catch (error) {
    console.error("Erro ao atualizar parcelamento:", error)
    return NextResponse.json({ message: "Erro ao atualizar parcelamento" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ message: "Token não fornecido" }, { status: 401 })
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    const db = getDatabase()
    const body = await request.json()
    const { id } = body
    const result = db.prepare(
      `DELETE FROM installments WHERE id = ? AND userId = ?`
    ).run(id, user.id)
    return NextResponse.json({ changes: result.changes })
  } catch (error) {
    return NextResponse.json({ message: "Erro ao excluir parcelamento" }, { status: 500 })
  }
} 