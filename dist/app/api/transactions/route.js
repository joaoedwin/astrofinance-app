"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
async function GET(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const db = (0, db_1.getDatabase)();
        const transactions = db.prepare("SELECT t.*, c.name as category FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY date DESC").all(decoded.userId);
        return server_1.NextResponse.json(transactions);
    }
    catch (error) {
        console.error("[API] Erro ao buscar transações:", error);
        return server_1.NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { amount, date, description, type, categoryId } = body;
        // Verificar autenticação
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const userId = decoded.userId;
        if (!amount || !date || !description || !type || !categoryId) {
            return server_1.NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
        }
        const db = (0, db_1.getDatabase)();
        const id = (0, db_1.randomUUID)();
        console.log("[API] Inserindo transação:", {
            id,
            userId,
            date,
            description,
            amount,
            type,
            categoryId
        });
        db.prepare("INSERT INTO transactions (id, date, description, amount, type, category_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, date, description, amount, type, categoryId, userId);
        const transaction = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
        console.log("[API] Transação inserida no banco:", transaction);
        // Verificar se a transação foi efetivamente inserida
        if (!transaction) {
            console.error("[API] Transação não foi inserida no banco");
            return server_1.NextResponse.json({ error: "Erro ao inserir transação no banco" }, { status: 500 });
        }
        // Contar quantas transações o usuário tem no total para verificação
        const count = db.prepare("SELECT COUNT(*) as total FROM transactions WHERE user_id = ?").get(userId);
        console.log(`[API] Total de transações para o usuário ${userId}: ${count.total}`);
        return server_1.NextResponse.json(transaction, { status: 201 });
    }
    catch (error) {
        console.error("[API] Erro ao criar transação:", error);
        return server_1.NextResponse.json({ error: "Erro ao criar transação", details: error.message }, { status: 500 });
    }
}
