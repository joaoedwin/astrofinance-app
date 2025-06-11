"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
// Helper para autenticação
function getUserIdFromRequest(request) {
    const auth = request.headers.get("Authorization");
    if (!auth)
        return null;
    const token = auth.split(" ")[1];
    if (!token)
        return null;
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        return decoded.userId;
    }
    catch {
        return null;
    }
}
async function GET(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const goals = db.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    return server_1.NextResponse.json(goals);
}
async function POST(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { name, description, target_amount, category_id, type, recurrence, start_date, end_date } = body;
    if (!name || !target_amount || !type || !start_date) {
        return server_1.NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
    }
    const id = (0, db_1.randomUUID)();
    db.prepare(`INSERT INTO goals (id, user_id, name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`)
        .run(id, userId, name, description || '', target_amount, category_id || null, type, recurrence || null, start_date, end_date || null);
    const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
    return server_1.NextResponse.json(goal, { status: 201 });
}
async function PUT(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { id, name, description, target_amount, category_id, type, recurrence, start_date, end_date, status } = body;
    if (!id)
        return server_1.NextResponse.json({ message: "ID da meta não informado" }, { status: 400 });
    db.prepare(`UPDATE goals SET name = ?, description = ?, target_amount = ?, category_id = ?, type = ?, recurrence = ?, start_date = ?, end_date = ?, status = ? WHERE id = ? AND user_id = ?`)
        .run(name, description, target_amount, category_id, type, recurrence, start_date, end_date, status, id, userId);
    const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
    return server_1.NextResponse.json(goal);
}
async function DELETE(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
        return server_1.NextResponse.json({ message: "ID da meta não informado" }, { status: 400 });
    db.prepare("DELETE FROM goals WHERE id = ? AND user_id = ?").run(id, userId);
    return server_1.NextResponse.json({ success: true });
}
