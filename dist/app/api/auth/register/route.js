"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
async function POST(request) {
    try {
        const { email, password, name } = await request.json();
        // Validação básica
        if (!email || !password || !name) {
            return server_1.NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
        }
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return server_1.NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }
        // Validar tamanho da senha
        if (password.length < 6) {
            return server_1.NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
        }
        const user = await (0, auth_1.registerUser)(email, password, name);
        return server_1.NextResponse.json({
            message: 'Usuário registrado com sucesso',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'user'
            }
        }, { status: 201 });
    }
    catch (error) {
        console.error('Erro ao registrar usuário:', error);
        if (error.message === 'Email já está em uso') {
            return server_1.NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
        }
        return server_1.NextResponse.json({ error: 'Erro ao registrar usuário' }, { status: 500 });
    }
}
