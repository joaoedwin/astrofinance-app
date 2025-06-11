import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db.js"
import bcrypt from "bcrypt"
import { verify } from "jsonwebtoken"
import type { User } from "@/types/database"

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json()
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const user = await db.get<User>("SELECT * FROM users WHERE id = ?", [userId])

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "Senha não definida para este usuário" },
        { status: 400 }
      )
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      )
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao alterar senha:", error)
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    )
  }
} 