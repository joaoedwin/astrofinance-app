"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("@/lib/auth");
async function PUT(request, { params }) {
    try {
        // Verificação de autenticação
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const id = params.id;
        const body = await request.json();
        const { amount, date, description, type, category } = body;
        if (!amount || !date || !description || !type || !category) {
            return server_1.NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
        }
        // Buscar o id da categoria pelo nome, se necessário
        let categoryId = category;
        if (category.length !== 36) { // se não for um UUID
            const cat = db.prepare("SELECT id FROM categories WHERE name = ?").get(category);
            if (!cat) {
                return server_1.NextResponse.json({ error: "Categoria não encontrada" }, { status: 400 });
            }
            categoryId = cat.id;
        }
        // Verificar se a transação pertence ao usuário
        const transaction = db.prepare("SELECT * FROM transactions WHERE id = ? AND (user_id = ? OR user_id = 'default')").get(id, user.id);
        if (!transaction) {
            return server_1.NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
        }
        db.prepare(`UPDATE transactions SET amount = ?, date = ?, description = ?, type = ?, category_id = ? WHERE id = ?`).run(amount, date, description, type, categoryId, id);
        const updated = db.prepare("SELECT * FROM transactions WHERE id = ?").get(id);
        return server_1.NextResponse.json(updated);
    }
    catch (error) {
        console.error("[API] Erro ao atualizar transação:", error);
        return server_1.NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
    }
}
async function DELETE(request, { params }) {
    try {
        // Verificação de autenticação
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const id = params.id;
        // Verificar se a transação existe e pertence ao usuário
        const transaction = db.prepare("SELECT * FROM transactions WHERE id = ? AND (user_id = ? OR user_id = 'default')").get(id, user.id);
        if (!transaction) {
            return server_1.NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
        }
        const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
        if (result.changes === 0) {
            return server_1.NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
        }
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error("[API] Erro ao deletar transação:", error);
        return server_1.NextResponse.json({ error: "Erro ao deletar transação" }, { status: 500 });
    }
}
