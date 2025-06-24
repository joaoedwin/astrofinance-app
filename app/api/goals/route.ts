import { NextResponse } from "next/server"
import { getDatabase, randomUUID } from "@/lib/db"
import { verify } from "jsonwebtoken"

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Helper para autenticação
function getUserIdFromRequest(request: Request) {
  const auth = request.headers.get("Authorization")
  if (!auth) return null
  const token = auth.split(" ")[1]
  if (!token) return null
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  const db = getDatabase()
  const goals = db.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC").all(userId)
  return NextResponse.json(goals)
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  const db = getDatabase()
  const body = await request.json()
  const {
    name, description, target_amount, category_id, type, recurrence, start_date, end_date
  } = body
  if (!name || !target_amount || !type || !start_date) {
    return NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 })
  }
  const id = randomUUID()
  db.prepare(`INSERT INTO goals (id, user_id, name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`)
    .run(id, userId, name, description || '', target_amount, category_id || null, type, recurrence || null, start_date, end_date || null)
  const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id)
  return NextResponse.json(goal, { status: 201 })
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  const db = getDatabase()
  const body = await request.json()
  const { id, name, description, target_amount, category_id, type, recurrence, start_date, end_date, status } = body
  if (!id) return NextResponse.json({ message: "ID da meta não informado" }, { status: 400 })
  db.prepare(`UPDATE goals SET name = ?, description = ?, target_amount = ?, category_id = ?, type = ?, recurrence = ?, start_date = ?, end_date = ?, status = ? WHERE id = ? AND user_id = ?`)
    .run(name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, id, userId)
  const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id)
  return NextResponse.json(goal)
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  const db = getDatabase()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ message: "ID da meta não informado" }, { status: 400 })
  db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(id, userId)
  return NextResponse.json({ success: true })
} 