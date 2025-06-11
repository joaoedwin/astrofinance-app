"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
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
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("goal_id");
    const month = searchParams.get("month");
    let query = "SELECT * FROM goal_reserves WHERE user_id = ?";
    let params = [userId];
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
    return server_1.NextResponse.json(reserves);
}
async function POST(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { goal_id, month, amount } = body;
    if (!goal_id || !month || typeof amount !== "number")
        return server_1.NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
    const id = (0, db_1.randomUUID)();
    try {
        db.prepare(`INSERT INTO goal_reserves (id, goal_id, user_id, month, amount) VALUES (?, ?, ?, ?, ?)`)
            .run(id, goal_id, userId, month, amount);
        const reserve = db.prepare("SELECT * FROM goal_reserves WHERE id = ?").get(id);
        return server_1.NextResponse.json(reserve, { status: 201 });
    }
    catch (err) {
        if (err.message.includes("UNIQUE")) {
            return server_1.NextResponse.json({ message: "Já existe uma reserva para este mês." }, { status: 409 });
        }
        return server_1.NextResponse.json({ message: err.message }, { status: 500 });
    }
}
async function PUT(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { id, amount } = body;
    if (!id || typeof amount !== "number")
        return server_1.NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
    db.prepare(`UPDATE goal_reserves SET amount = ? WHERE id = ? AND user_id = ?`).run(amount, id, userId);
    const reserve = db.prepare("SELECT * FROM goal_reserves WHERE id = ?").get(id);
    return server_1.NextResponse.json(reserve);
}
async function DELETE(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
        return server_1.NextResponse.json({ message: "ID da reserva não informado" }, { status: 400 });
    db.prepare("DELETE FROM goal_reserves WHERE id = ? AND user_id = ?").run(id, userId);
    return server_1.NextResponse.json({ success: true });
}
