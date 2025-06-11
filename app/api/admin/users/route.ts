import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const db = getDatabase();
    const users = await db.all(
      `SELECT id, name, email, role, created_at FROM users`
    );
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, role } = await request.json();
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }
    const db = getDatabase();
    const id = randomUUID();
    const password = Math.random().toString(36).slice(-10);
    const password_hash = await bcrypt.hash(password, 10);
    await db.run(
      `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, password_hash, role]
    );
    return NextResponse.json({ id, name, email, role, password }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, email, role, resetPassword } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }
    const db = getDatabase();
    let password;
    if (resetPassword) {
      password = Math.random().toString(36).slice(-10);
      const password_hash = await bcrypt.hash(password, 10);
      await db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, id]);
    }
    if (name || email || role) {
      await db.run(
        `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role) WHERE id = ?`,
        [name, email, role, id]
      );
    }
    return NextResponse.json({ success: true, password }, { status: 200 });
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    return NextResponse.json({ error: "Erro ao editar usuário" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }
    const db = getDatabase();
    await db.run(`DELETE FROM users WHERE id = ?`, [id]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
} 