"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("@/lib/auth");
// Middleware para verificar se o usuário é admin
async function isAdmin(request) {
    const token = request.headers.get("Authorization")?.split(" ")[1];
    if (!token)
        return false;
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        return user?.role === "admin";
    }
    catch {
        return false;
    }
}
async function POST(request) {
    try {
        if (!await isAdmin(request)) {
            return server_1.NextResponse.json({ message: "Acesso negado" }, { status: 403 });
        }
        const { title, message, type } = await request.json();
        if (!title || !message || !type) {
            return server_1.NextResponse.json({ message: "Campos obrigatórios faltando" }, { status: 400 });
        }
        // Validar o tipo de notificação
        if (!['update', 'announce'].includes(type)) {
            return server_1.NextResponse.json({ message: "Tipo de notificação inválido" }, { status: 400 });
        }
        const db = (0, db_1.getDatabase)();
        const now = new Date().toISOString();
        // Inserir notificação para todos os usuários
        const users = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
        const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, message, created_at)
      VALUES (?, ?, ?, ?)
    `);
        for (const user of users) {
            stmt.run(user.id, type, message, now);
        }
        return server_1.NextResponse.json({ success: true }, { status: 201 });
    }
    catch (error) {
        console.error("[API] Erro ao criar notificação:", error);
        return server_1.NextResponse.json({ message: "Erro ao criar notificação" }, { status: 500 });
    }
}
async function GET(request) {
    try {
        if (!await isAdmin(request)) {
            return server_1.NextResponse.json({ message: "Acesso negado" }, { status: 403 });
        }
        const db = (0, db_1.getDatabase)();
        const notifications = db.prepare(`
      SELECT n.*, COUNT(DISTINCT n.user_id) as recipient_count
      FROM notifications n
      WHERE n.type IN ('update', 'announce')
      GROUP BY n.message, n.created_at
      ORDER BY n.created_at DESC
    `).all();
        return server_1.NextResponse.json(notifications);
    }
    catch (error) {
        console.error("[API] Erro ao buscar notificações:", error);
        return server_1.NextResponse.json({ message: "Erro ao buscar notificações" }, { status: 500 });
    }
}
