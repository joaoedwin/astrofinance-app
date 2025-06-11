import { NextResponse } from "next/server";
import { getDatabase, randomUUID } from "@/lib/db";
import { format } from "date-fns";

interface Goal {
  id: string
  name: string
  type: string
  status: string
  user_id: string
}

interface GoalReserve {
  id: string
  goal_id: string
  user_id: string
  month: string
  amount: number
}

interface Notification {
  id: string
  user_id: string
  goal_id: string
  type: string
  message: string
  read: number
}

export async function GET() {
  const db = getDatabase();
  const now = new Date();
  const mesAtual = format(now, "yyyy-MM");
  
  // Buscar metas de compra/objetivo ativas
  const goals = db.prepare("SELECT * FROM goals WHERE type = 'purchase' AND status = 'active'").all() as Goal[];
  let notificacoesCriadas = 0;
  
  for (const goal of goals) {
    // Já existe reserva para o mês?
    const reserva = db.prepare("SELECT * FROM goal_reserves WHERE goal_id = ? AND user_id = ? AND month = ?")
      .get(goal.id, goal.user_id, mesAtual) as GoalReserve | undefined;
    if (reserva) continue;
    
    // Já existe notificação não lida para essa meta e mês?
    const noti = db.prepare("SELECT * FROM notifications WHERE user_id = ? AND goal_id = ? AND type = 'goal_reserve' AND read = 0 AND message LIKE ?")
      .get(goal.user_id, goal.id, `%${mesAtual}%`) as Notification | undefined;
    if (noti) continue;
    
    // Criar notificação
    const id = randomUUID();
    const message = `Informe quanto você reservou para a meta '${goal.name}' no mês ${mesAtual}. Clique na meta para preencher.`;
    db.prepare("INSERT INTO notifications (id, user_id, type, goal_id, message) VALUES (?, ?, 'goal_reserve', ?, ?)")
      .run(id, goal.user_id, goal.id, message);
    notificacoesCriadas++;
  }
  
  return NextResponse.json({ notificacoesCriadas });
} 