import { NextResponse } from "next/server";
import { getDatabase, randomUUID } from "@/lib/db";
import { verify } from "jsonwebtoken";

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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
  const unread = searchParams.get("unread");
  let notifications;
  if (unread === "1") {
    notifications = db.prepare(
      "SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) AND (read = 0 OR read IS NULL) ORDER BY created_at DESC"
    ).all(userId);
  } else {
    notifications = db.prepare(
      "SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL) ORDER BY created_at DESC"
    ).all(userId);
  }
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const body = await request.json();
  const { type, goal_id, message } = body;
  if (!type || !message) return NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
  const id = randomUUID();
  db.prepare(`INSERT INTO notifications (id, user_id, type, goal_id, message) VALUES (?, ?, ?, ?, ?)`)
    .run(id, userId, type, goal_id || null, message);
  const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id);
  return NextResponse.json(notification, { status: 201 });
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const body = await request.json();
  
  // Se receber markAllRead=true, marca todas as notificações como lidas
  if (body.markAllRead) {
    db.prepare(
      "UPDATE notifications SET read = 1 WHERE (user_id = ? OR user_id IS NULL) AND (read = 0 OR read IS NULL)"
    ).run(userId);
    return NextResponse.json({ success: true });
  }
  
  // Caso contrário, marca apenas uma notificação específica como lida
  const { id, read } = body;
  if (!id) return NextResponse.json({ message: "ID da notificação não informado" }, { status: 400 });
  
  // Atualiza a notificação (inclui tanto notificações com user_id = userId quanto user_id = NULL)
  db.prepare(
    "UPDATE notifications SET read = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)"
  ).run(read ? 1 : 0, id, userId);
  
  const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id);
  return NextResponse.json(notification);
}

export async function DELETE(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  const db = getDatabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID da notificação não informado" }, { status: 400 });
  db.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").run(id, userId);
  return NextResponse.json({ success: true });
} 