import { NextResponse } from "next/server";
import { getDatabase, randomUUID } from "@/lib/db";
import { verify } from "jsonwebtoken";

function getUserIdFromRequest(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goal_id");
  const month = searchParams.get("month");
  let query = "SELECT * FROM goal_reserves WHERE user_id = ?";
  let params: any[] = [userId];
  if (goalId) {
    query += " AND goal_id = ?";
    params.push(goalId);
  }
  if (month) {
    query += " AND month = ?";
    params.push(month);
  }
  query += " ORDER BY month ASC";
  const reserves = db.prepare(query).all(...params);
  return NextResponse.json(reserves);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const body = await request.json();
  const { goal_id, month, amount } = body;
  if (!goal_id || !month || typeof amount !== "number") return NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
  const id = randomUUID();
  try {
    db.prepare(`INSERT INTO goal_reserves (id, goal_id, user_id, month, amount) VALUES (?, ?, ?, ?, ?)`)
      .run(id, goal_id, userId, month, amount);
    const reserve = db.prepare("SELECT * FROM goal_reserves WHERE id = ?").get(id);
    return NextResponse.json(reserve, { status: 201 });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      return NextResponse.json({ message: "Já existe uma reserva para este mês." }, { status: 409 });
    }
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const body = await request.json();
  const { id, amount } = body;
  if (!id || typeof amount !== "number") return NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
  db.prepare(`UPDATE goal_reserves SET amount = ? WHERE id = ? AND user_id = ?`).run(amount, id, userId);
  const reserve = db.prepare("SELECT * FROM goal_reserves WHERE id = ?").get(id);
  return NextResponse.json(reserve);
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID da reserva não informado" }, { status: 400 });
  db.prepare("DELETE FROM goal_reserves WHERE id = ? AND user_id = ?").run(id, userId);
  return NextResponse.json({ success: true });
} 