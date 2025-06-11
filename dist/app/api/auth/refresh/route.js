"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const jsonwebtoken_1 = require("jsonwebtoken");
const db_1 = require("@/lib/db");
async function POST(request) {
    try {
        const { refreshToken } = await request.json();
        if (!refreshToken) {
            return server_1.NextResponse.json({ message: "Refresh token não fornecido" }, { status: 400 });
        }
        // Verifica o refresh token
        const decoded = (0, jsonwebtoken_1.verify)(refreshToken, process.env.JWT_SECRET || "your-secret-key");
        // Busca o usuário usando SQLite
        const db = (0, db_1.getDatabase)();
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId);
        if (!user) {
            return server_1.NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
        }
        // Gera novo access token
        const token = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "15m" });
        // Gera novo refresh token
        const newRefreshToken = (0, jsonwebtoken_1.sign)({ userId: user.id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });
        return server_1.NextResponse.json({
            token,
            refreshToken: newRefreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });
    }
    catch (error) {
        console.error("[AUTH] Erro ao atualizar token:", error);
        return server_1.NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }
}
