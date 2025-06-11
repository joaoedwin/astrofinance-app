"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("@/lib/auth");
async function GET(request) {
    try {
        // Verificar autenticação
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token) {
            console.error("[API] Token não fornecido");
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
            const user = await (0, auth_1.getUserById)(decoded.userId);
            if (!user) {
                console.error("[API] Usuário não encontrado");
                return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
            }
            const db = (0, db_1.getDatabase)();
            // Buscar tanto as categorias do usuário quanto as categorias "default" (sem filtrar por tipo)
            const query = "SELECT * FROM categories WHERE user_id = ? OR user_id = 'default' ORDER BY name";
            const params = [user.id];
            const categories = db.prepare(query).all(...params);
            return server_1.NextResponse.json(categories);
        }
        catch (error) {
            console.error("[API] Erro na verificação do token:", error);
            return server_1.NextResponse.json({ message: "Token inválido" }, { status: 401 });
        }
    }
    catch (error) {
        console.error("[API] Erro ao buscar categorias:", error);
        return server_1.NextResponse.json({ message: "Erro ao buscar categorias" }, { status: 500 });
    }
}
async function POST(request) {
    try {
        // Verificar autenticação
        const token = request.headers.get("Authorization")?.split(" ")[1];
        if (!token)
            return server_1.NextResponse.json({ message: "Token não fornecido" }, { status: 401 });
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
        const user = await (0, auth_1.getUserById)(decoded.userId);
        if (!user)
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        const body = await request.json();
        // Define o tipo padrão como 'expense' se não for fornecido
        const { name, type = "expense", color, icon } = body;
        // Validação e sanitização dos dados
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return server_1.NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 });
        }
        const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "");
        const validatedColor = color && typeof color === 'string' && color.match(/^#[0-9A-Fa-f]{6}$/)
            ? color
            : "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const validatedIcon = icon && typeof icon === 'string' && icon.trim().length > 0
            ? icon.trim().substring(0, 20).replace(/[<>"']/g, "")
            : "tag";
        const db = (0, db_1.getDatabase)();
        const id = (0, db_1.randomUUID)();
        const now = new Date().toISOString();
        // Verificar limite de categorias por usuário
        const categoryCount = db.prepare(`SELECT COUNT(*) as count FROM categories WHERE user_id = ?`).get(user.id);
        const MAX_CATEGORIES = 50;
        if (categoryCount && categoryCount.count >= MAX_CATEGORIES) {
            return server_1.NextResponse.json({ message: `Limite de ${MAX_CATEGORIES} categorias atingido` }, { status: 400 });
        }
        // Verificar se a categoria já existe para este usuário
        const existingCategory = db.prepare("SELECT * FROM categories WHERE user_id = ? AND name = ?").get(user.id, sanitizedName);
        if (existingCategory) {
            return server_1.NextResponse.json({ message: `Já existe uma categoria '${sanitizedName}'` }, { status: 400 });
        }
        // Inserir categoria - garantir que type seja 'income' ou 'expense'
        const finalType = ["income", "expense"].includes(type) ? type : "expense";
        db.prepare("INSERT INTO categories (id, name, type, color, icon, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, sanitizedName, finalType, validatedColor, validatedIcon, user.id, now, now);
        const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        return server_1.NextResponse.json(category, { status: 201 });
    }
    catch (error) {
        console.error("[API] Erro ao criar categoria:", error);
        return server_1.NextResponse.json({ message: "Erro ao criar categoria" }, { status: 500 });
    }
}
// Simplificar o método PUT também
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
        const { id, name } = body;
        // Validação dos dados
        if (!id) {
            return server_1.NextResponse.json({ message: "ID da categoria é obrigatório" }, { status: 400 });
        }
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return server_1.NextResponse.json({ message: "Nome é obrigatório e deve ser uma string válida" }, { status: 400 });
        }
        const sanitizedName = name.trim().substring(0, 50).replace(/[<>"']/g, "");
        const db = (0, db_1.getDatabase)();
        const now = new Date().toISOString();
        // Verificar se a categoria existe e pertence ao usuário
        const category = db.prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?").get(id, user.id);
        if (!category) {
            return server_1.NextResponse.json({ message: "Categoria não encontrada" }, { status: 404 });
        }
        // Atualizar apenas o nome
        db.prepare("UPDATE categories SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(sanitizedName, now, id, user.id);
        const updatedCategory = db.prepare("SELECT * FROM categories WHERE id = ?").get(id);
        return server_1.NextResponse.json(updatedCategory);
    }
    catch (error) {
        console.error("[API] Erro ao atualizar categoria:", error);
        return server_1.NextResponse.json({ message: "Erro ao atualizar categoria" }, { status: 500 });
    }
}
// Adicionar endpoint DELETE para excluir categorias
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
            return server_1.NextResponse.json({ message: "ID da categoria é obrigatório" }, { status: 400 });
        }
        const db = (0, db_1.getDatabase)();
        // Verificar se a categoria existe e pertence ao usuário
        const category = db.prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?").get(id, user.id);
        if (!category) {
            return server_1.NextResponse.json({ message: "Categoria não encontrada" }, { status: 404 });
        }
        // Verificar se existem transações usando esta categoria
        const transactionsCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category_id = ?").get(id);
        if (transactionsCount && transactionsCount.count > 0) {
            return server_1.NextResponse.json({ message: "Não é possível excluir uma categoria que possui transações associadas" }, { status: 400 });
        }
        // Verificar se existem parcelamentos usando esta categoria
        const installmentsCount = db.prepare("SELECT COUNT(*) as count FROM installments WHERE category_id = ?").get(id);
        if (installmentsCount && installmentsCount.count > 0) {
            return server_1.NextResponse.json({ message: "Não é possível excluir uma categoria que possui parcelamentos associados" }, { status: 400 });
        }
        // Excluir a categoria
        db.prepare("DELETE FROM categories WHERE id = ? AND user_id = ?").run(id, user.id);
        return server_1.NextResponse.json({ message: "Categoria excluída com sucesso" });
    }
    catch (error) {
        console.error("[API] Erro ao excluir categoria:", error);
        return server_1.NextResponse.json({ message: "Erro ao excluir categoria" }, { status: 500 });
    }
}
