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
    const unread = searchParams.get("unread");
    let notifications;
    if (unread === "1") {
        notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC").all(userId);
    }
    else {
        notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    }
    return server_1.NextResponse.json(notifications);
}
async function POST(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { type, goal_id, message } = body;
    if (!type || !message)
        return server_1.NextResponse.json({ message: "Campos obrigatórios ausentes" }, { status: 400 });
    const id = (0, db_1.randomUUID)();
    db.prepare(`INSERT INTO notifications (id, user_id, type, goal_id, message) VALUES (?, ?, ?, ?, ?)`)
        .run(id, userId, type, goal_id || null, message);
    const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id);
    return server_1.NextResponse.json(notification, { status: 201 });
}
async function PUT(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const body = await request.json();
    const { id, read } = body;
    if (!id)
        return server_1.NextResponse.json({ message: "ID da notificação não informado" }, { status: 400 });
    db.prepare(`UPDATE notifications SET read = ? WHERE id = ? AND user_id = ?`).run(read ? 1 : 0, id, userId);
    const notification = db.prepare("SELECT * FROM notifications WHERE id = ?").get(id);
    return server_1.NextResponse.json(notification);
}
async function DELETE(request) {
    const userId = getUserIdFromRequest(request);
    if (!userId)
        return server_1.NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    const db = (0, db_1.getDatabase)();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id)
        return server_1.NextResponse.json({ message: "ID da notificação não informado" }, { status: 400 });
    db.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").run(id, userId);
    return server_1.NextResponse.json({ success: true });
}
