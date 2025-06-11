"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const crypto_1 = require("crypto");
async function GET(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token) {
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        }
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user) {
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        }
        const db = (0, db_1.getDatabase)();
        // Buscar parcelamentos do usuário no banco
        const installments = db.prepare(`SELECT i.*, c.name as category, cc.name as creditCardName, cc.color as creditCardColor 
       FROM installments i
       JOIN categories c ON i.category_id = c.id
       LEFT JOIN credit_cards cc ON i.creditCardId = cc.id
       WHERE i.userId = ?
       ORDER BY i.nextPaymentDate ASC`).all(user.id);
        return server_1.NextResponse.json({ installments });
    }
    catch (error) {
        return server_1.NextResponse.json({ message: "Erro ao buscar parcelamentos" }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const body = await request.json();
        const { description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate } = body;
        const result = db.prepare(`INSERT INTO installments (id, userId, description, category_id, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, type, creditCardId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run((0, crypto_1.randomUUID)(), user.id, description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, 'expense', body.creditCardId || null);
        return server_1.NextResponse.json({ id: result.lastInsertRowid });
    }
    catch (error) {
        console.error("Erro ao criar parcelamento:", error);
        return server_1.NextResponse.json({ message: "Erro ao criar parcelamento" }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const body = await request.json();
        const { id, description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate } = body;
        const result = db.prepare(`UPDATE installments SET description = ?, category_id = ?, totalAmount = ?, installmentAmount = ?, totalInstallments = ?, paidInstallments = ?, startDate = ?, nextPaymentDate = ?, type = ?, creditCardId = ? WHERE id = ? AND userId = ?`).run(description, categoryId, totalAmount, installmentAmount, totalInstallments, paidInstallments, startDate, nextPaymentDate, 'expense', body.creditCardId || null, id, user.id);
        return server_1.NextResponse.json({ changes: result.changes });
    }
    catch (error) {
        console.error("Erro ao atualizar parcelamento:", error);
        return server_1.NextResponse.json({ message: "Erro ao atualizar parcelamento" }, { status: 500 });
    }
}
async function DELETE(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const body = await request.json();
        const { id } = body;
        const result = db.prepare(`DELETE FROM installments WHERE id = ? AND userId = ?`).run(id, user.id);
        return server_1.NextResponse.json({ changes: result.changes });
    }
    catch (error) {
        return server_1.NextResponse.json({ message: "Erro ao excluir parcelamento" }, { status: 500 });
    }
}
