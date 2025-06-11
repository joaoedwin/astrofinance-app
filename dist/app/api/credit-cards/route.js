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
async function GET(request) {
    try {
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const db = (0, db_1.getDatabase)();
        const cards = db.prepare(`SELECT * FROM credit_cards WHERE userId = ? ORDER BY name ASC`).all(user.id);
        return server_1.NextResponse.json(cards);
    }
    catch (error) {
        console.error("Erro ao buscar cartões:", error);
        return server_1.NextResponse.json({ message: "Erro ao buscar cartões" }, { status: 500 });
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
        const body = await request.json();
        const { name, color, lastFourDigits } = body;
        // Validações de segurança
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return server_1.NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 });
        }
        if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
            return server_1.NextResponse.json({ message: "Cor é obrigatória e deve ser um valor hexadecimal válido" }, { status: 400 });
        }
        if (lastFourDigits !== null && lastFourDigits !== undefined &&
            (typeof lastFourDigits !== 'string' || !lastFourDigits.match(/^\d{0,4}$/))) {
            return server_1.NextResponse.json({ message: "Últimos dígitos devem ser um número de até 4 dígitos" }, { status: 400 });
        }
        // Verificar limite de cartões
        const db = (0, db_1.getDatabase)();
        const cardCount = db.prepare(`SELECT COUNT(*) as count FROM credit_cards WHERE userId = ?`).get(user.id);
        if (cardCount.count >= 6) {
            return server_1.NextResponse.json({ message: "Limite de 6 cartões atingido" }, { status: 400 });
        }
        const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "");
        const now = new Date().toISOString();
        const result = db.prepare(`INSERT INTO credit_cards (userId, name, color, lastFourDigits, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`).run(user.id, sanitizedName, color, lastFourDigits || null, now, now);
        const card = db.prepare(`SELECT * FROM credit_cards WHERE id = ?`).get(result.lastInsertRowid);
        return server_1.NextResponse.json(card);
    }
    catch (error) {
        console.error("Erro ao criar cartão:", error);
        return server_1.NextResponse.json({ message: "Erro ao criar cartão" }, { status: 500 });
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
        const body = await request.json();
        const { id, name, color, lastFourDigits } = body;
        // Validações de segurança
        if (!id) {
            return server_1.NextResponse.json({ message: "ID é obrigatório" }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return server_1.NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 });
        }
        if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
            return server_1.NextResponse.json({ message: "Cor é obrigatória e deve ser um valor hexadecimal válido" }, { status: 400 });
        }
        if (lastFourDigits !== null && lastFourDigits !== undefined &&
            (typeof lastFourDigits !== 'string' || !lastFourDigits.match(/^\d{0,4}$/))) {
            return server_1.NextResponse.json({ message: "Últimos dígitos devem ser um número de até 4 dígitos" }, { status: 400 });
        }
        const db = (0, db_1.getDatabase)();
        const now = new Date().toISOString();
        const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "");
        db.prepare(`UPDATE credit_cards 
       SET name = ?, color = ?, lastFourDigits = ?, updatedAt = ?
       WHERE id = ? AND userId = ?`).run(sanitizedName, color, lastFourDigits || null, now, id, user.id);
        const card = db.prepare(`SELECT * FROM credit_cards WHERE id = ? AND userId = ?`).get(id, user.id);
        if (!card) {
            return server_1.NextResponse.json({ message: "Cartão não encontrado" }, { status: 404 });
        }
        return server_1.NextResponse.json(card);
    }
    catch (error) {
        console.error("Erro ao atualizar cartão:", error);
        return server_1.NextResponse.json({ message: "Erro ao atualizar cartão" }, { status: 500 });
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) {
            return server_1.NextResponse.json({ message: "ID do cartão é obrigatório" }, { status: 400 });
        }
        // Validar formato do ID
        const cardId = parseInt(id);
        if (isNaN(cardId)) {
            return server_1.NextResponse.json({ message: "ID do cartão inválido" }, { status: 400 });
        }
        const db = (0, db_1.getDatabase)();
        // Verificar se o cartão existe e pertence ao usuário
        const card = db.prepare(`SELECT * FROM credit_cards WHERE id = ? AND userId = ?`).get(cardId, user.id);
        if (!card) {
            return server_1.NextResponse.json({ message: "Cartão não encontrado" }, { status: 404 });
        }
        // Verificar se existem parcelamentos usando este cartão
        const installments = db.prepare(`SELECT COUNT(*) as count FROM installments WHERE creditCardId = ?`).get(cardId);
        if (installments && installments.count > 0) {
            return server_1.NextResponse.json({ message: "Não é possível excluir um cartão que possui parcelamentos associados" }, { status: 400 });
        }
        // Excluir o cartão
        db.prepare(`DELETE FROM credit_cards WHERE id = ? AND userId = ?`).run(cardId, user.id);
        return server_1.NextResponse.json({ message: "Cartão excluído com sucesso" });
    }
    catch (error) {
        console.error("Erro ao excluir cartão:", error);
        return server_1.NextResponse.json({ message: "Erro ao excluir cartão" }, { status: 500 });
    }
}
