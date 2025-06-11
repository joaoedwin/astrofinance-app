"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = require("@/lib/auth");
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
        return server_1.NextResponse.json({ user });
    }
    catch (error) {
        return server_1.NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }
}
