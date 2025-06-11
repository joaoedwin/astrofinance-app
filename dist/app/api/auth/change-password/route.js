"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const db_1 = require("@/lib/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = require("jsonwebtoken");
async function POST(request) {
    try {
        const db = (0, db_1.getDatabase)();
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            console.error("[change-password] Sem header de autorização");
            return server_1.NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "");
        let userId = null;
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET || "your-secret-key");
            userId = decoded.userId;
            console.log("[change-password] userId extraído do token:", userId);
        }
        catch (err) {
            console.error("[change-password] Token inválido", err);
            return server_1.NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) {
            console.error("[change-password] Campos obrigatórios ausentes");
            return server_1.NextResponse.json({ error: "Preencha todos os campos" }, { status: 400 });
        }
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
        if (!user) {
            console.error("[change-password] Usuário não encontrado no banco", userId);
            return server_1.NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
        }
        if (!user.password_hash) {
            console.error("[change-password] Usuário sem senha definida no banco", userId);
            return server_1.NextResponse.json({ error: "Usuário sem senha definida. Faça login novamente ou redefina sua senha." }, { status: 400 });
        }
        // Verifica senha atual
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password_hash);
        if (!valid) {
            console.error("[change-password] Senha atual incorreta");
            return server_1.NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
        }
        // Atualiza senha
        const hash = await bcryptjs_1.default.hash(newPassword, 10);
        db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
        console.log("[change-password] Senha alterada com sucesso para userId:", userId);
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error("[change-password] Erro inesperado:", error);
        return server_1.NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
    }
}
