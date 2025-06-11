"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = require("@/lib/db.js");
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sua-chave-refresh-secreta';
async function POST(request) {
    try {
        const { email, password } = await request.json();
        const db = (0, db_js_1.getDatabase)();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || !(await bcrypt_1.default.compare(password, user.password_hash))) {
            return server_1.NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }
        // Access Token - expira em 15 minutos
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
        // Refresh Token - expira em 7 dias
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Atualiza o último login
        await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        const response = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            },
            accessToken,
            refreshToken
        };
        return server_1.NextResponse.json(response);
    }
    catch (error) {
        console.error('Erro no login:', error);
        return server_1.NextResponse.json({ error: 'Erro ao processar login' }, { status: 500 });
    }
}
