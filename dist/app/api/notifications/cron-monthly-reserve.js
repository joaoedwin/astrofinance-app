"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const date_fns_1 = require("date-fns");
async function GET() {
    const db = (0, db_1.getDatabase)();
    const now = new Date();
    const mesAtual = (0, date_fns_1.format)(now, "yyyy-MM");
    // Buscar metas de compra/objetivo ativas
    const goals = db.prepare("SELECT * FROM goals WHERE type = 'purchase' AND status = 'active'").all();
    let notificacoesCriadas = 0;
    for (const goal of goals) {
        // Já existe reserva para o mês?
        const reserva = db.prepare("SELECT * FROM goal_reserves WHERE goal_id = ? AND user_id = ? AND month = ?").get(goal.id, goal.user_id, mesAtual);
        if (reserva)
            continue;
        // Já existe notificação não lida para essa meta e mês?
        const noti = db.prepare("SELECT * FROM notifications WHERE user_id = ? AND goal_id = ? AND type = 'goal_reserve' AND read = 0 AND message LIKE ?").get(goal.user_id, goal.id, `%${mesAtual}%`);
        if (noti)
            continue;
        // Criar notificação
        const id = (0, db_1.randomUUID)();
        const message = `Informe quanto você reservou para a meta '${goal.name}' no mês ${mesAtual}. Clique na meta para preencher.`;
        db.prepare("INSERT INTO notifications (id, user_id, type, goal_id, message) VALUES (?, ?, 'goal_reserve', ?, ?)")
            .run(id, goal.user_id, goal.id, message);
        notificacoesCriadas++;
    }
    return server_1.NextResponse.json({ notificacoesCriadas });
}
