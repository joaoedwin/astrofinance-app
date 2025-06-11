"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.authenticateUser = authenticateUser;
exports.getUserById = getUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const db_1 = require("./db");
// Função para registrar um novo usuário
async function registerUser(email, password, name, role = 'user') {
    try {
        const db = (0, db_1.getDatabase)();
        // Verificar se o email já está em uso
        const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (existingUser) {
            throw new Error('Email já está em uso');
        }
        // Criar hash da senha
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Criar usuário
        const user = {
            id: (0, uuid_1.v4)(),
            email,
            name,
            role: role,
            created_at: new Date().toISOString()
        };
        db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(user.id, user.email, user.name, passwordHash, user.role);
        return user;
    }
    catch (error) {
        console.error('Erro ao registrar usuário:', error);
        throw error;
    }
}
// Função para autenticar um usuário
async function authenticateUser(email, password) {
    try {
        const db = (0, db_1.getDatabase)();
        // Buscar usuário
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        // Verificar senha
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash || '');
        if (!isValid) {
            throw new Error('Senha incorreta');
        }
        // Retornar usuário sem a senha
        const { password_hash, ...userWithoutPassword } = user;
        return { ...userWithoutPassword, isAdmin: user.role === 'admin' };
    }
    catch (error) {
        console.error('Erro ao autenticar usuário:', error);
        throw error;
    }
}
// Função para buscar um usuário pelo ID
async function getUserById(id) {
    try {
        const db = (0, db_1.getDatabase)();
        const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
        if (user) {
            user.isAdmin = user.role === 'admin';
        }
        return user;
    }
    catch (error) {
        console.error('Erro ao buscar usuário:', error);
        throw error;
    }
}
